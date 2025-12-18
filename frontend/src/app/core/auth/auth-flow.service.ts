import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthSession } from './auth.models';
import {
    AuthChannel,
    AuthErrorDescriptor,
    AuthFlowEvent,
    AuthFlowState,
} from './auth-flow.types';
import { sanitizeReturnUrl } from './return-url.util';

interface RequestChallengeResponse {
    challengeId: string;
    expiresAt: string;
    resendCooldown?: number;
    attemptCount?: number;
    maxAttempts?: number;
    message?: string;
}

interface VerifyOtpResponse {
    session?: AuthSession;
    mfaRequired?: boolean;
    mfaProviders?: string[];
    lockoutUntil?: string;
    attemptCount?: number;
    maxAttempts?: number;
    redirectUrl?: string;
}

interface ResendChallengeResponse {
    challengeId: string;
    resendCooldown?: number;
    message?: string;
    attemptCount?: number;
    maxAttempts?: number;
}

interface VerifyMfaResponse {
    session?: AuthSession;
    lockoutUntil?: string;
    redirectUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthFlowService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    private readonly availableChannels: AuthChannel[] = environment.auth?.availableChannels ?? [
        'email_magic_link',
        'email_otp',
    ];
    private readonly defaultChannel: AuthChannel = environment.auth?.preferredChannel ?? this.availableChannels[0];
    private readonly defaultResendCooldown = environment.auth?.defaultResendCooldownSeconds ?? 30;
    private readonly defaultReturnUrl = '/dashboard';
    private readonly apiBase = environment.apiUrl;
    private readonly mfaEnabled = environment.auth?.mfaEnabled ?? false;

    private readonly stateSignal = signal<AuthFlowState>({
        status: 'INIT',
        availableChannels: this.availableChannels,
        preferredChannel: this.defaultChannel,
    });

    readonly state = this.stateSignal.asReadonly();
    readonly status = computed(() => this.stateSignal().status);

    private targetReturnUrl = this.defaultReturnUrl;
    private cooldownTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.transitionToCollect();
    }

    dispatch(event: AuthFlowEvent): void {
        switch (event.type) {
            case 'RESET':
                this.transitionToCollect();
                return;
            case 'CANCEL':
                this.transitionToCollect();
                return;
            case 'CHOOSE_CHANNEL':
                this.changeChannel(event.channel);
                return;
            case 'SUBMIT_IDENTIFIER':
                this.handleSubmitIdentifier(event.identifier, event.channel).catch((err) =>
                    console.error('[AuthFlow] submit identifier error', err)
                );
                return;
            case 'RESEND':
                this.handleResend().catch((err) => console.error('[AuthFlow] resend error', err));
                return;
            case 'SUBMIT_OTP':
                this.handleSubmitOtp(event.code).catch((err) =>
                    console.error('[AuthFlow] submit otp error', err)
                );
                return;
            case 'SUBMIT_MFA':
                this.handleSubmitMfa(event.code, event.provider).catch((err) =>
                    console.error('[AuthFlow] submit mfa error', err)
                );
                return;
            default:
                return;
        }
    }

    setReturnUrl(raw: string | null | undefined): void {
        this.targetReturnUrl = sanitizeReturnUrl(this.router, raw ?? undefined, this.defaultReturnUrl);
    }

    private transitionToCollect(identifier: string = '', channel: AuthChannel = this.defaultChannel): void {
        this.clearCooldownTimer();
        this.stateSignal.set({
            status: 'COLLECT_IDENTIFIER',
            identifier,
            channel,
            availableChannels: this.availableChannels,
        });
    }

    private changeChannel(channel: AuthChannel): void {
        const current = this.stateSignal();
        if (current.status !== 'COLLECT_IDENTIFIER') {
            return;
        }
        if (!this.availableChannels.includes(channel)) {
            return;
        }
        this.stateSignal.set({
            ...current,
            channel,
            errorMessage: undefined,
        });
    }

    private async handleSubmitIdentifier(identifier: string, channel: AuthChannel): Promise<void> {
        const trimmed = identifier.trim();
        if (!trimmed) {
            this.stateSignal.update((state) =>
                state.status === 'COLLECT_IDENTIFIER'
                    ? { ...state, errorMessage: 'Enter a valid email or phone number.' }
                    : state
            );
            return;
        }

        this.stateSignal.set({
            status: 'REQUESTING_CHALLENGE',
            identifier: trimmed,
            channel,
            availableChannels: this.availableChannels,
        });

        try {
            const response = await firstValueFrom(
                this.http.post<RequestChallengeResponse>(`${this.apiBase}/auth/passwordless/challenge`, {
                    identifier: trimmed,
                    channel,
                })
            );

            this.stateSignal.set({
                status: 'CHALLENGE_SENT',
                identifier: trimmed,
                channel,
                challengeId: response.challengeId,
                attemptCount: response.attemptCount ?? 0,
                maxAttempts: response.maxAttempts,
                cooldownRemaining: response.resendCooldown ?? this.defaultResendCooldown,
                expiresAt: response.expiresAt,
                lastSentAt: new Date().toISOString(),
                message: response.message ?? this.buildChallengeMessage(channel, trimmed),
            });

            this.startResendCooldown(response.resendCooldown ?? this.defaultResendCooldown);
        } catch (error) {
            const descriptor = this.mapApiErrorToUserMessage(error);
            if (descriptor.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: trimmed,
                    channel,
                    lockoutUntil: descriptor.lockoutUntil,
                    attemptCount: 0,
                    message: descriptor.message,
                });
                return;
            }

            if (descriptor.retryable) {
                this.stateSignal.set({
                    status: 'COLLECT_IDENTIFIER',
                    identifier: trimmed,
                    channel,
                    availableChannels: this.availableChannels,
                    errorMessage: descriptor.message,
                });
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: trimmed,
                channel,
                code: descriptor.code,
                message: descriptor.message,
                retryable: false,
            });
        }
    }

    private async handleResend(): Promise<void> {
        const current = this.stateSignal();
        if (current.status !== 'CHALLENGE_SENT') {
            return;
        }
        if (current.cooldownRemaining > 0) {
            return;
        }

        try {
            const response = await firstValueFrom(
                this.http.post<ResendChallengeResponse>(`${this.apiBase}/auth/passwordless/resend`, {
                    identifier: current.identifier,
                    channel: current.channel,
                    challengeId: current.challengeId,
                })
            );

            this.stateSignal.set({
                ...current,
                challengeId: response.challengeId,
                attemptCount: response.attemptCount ?? current.attemptCount,
                maxAttempts: response.maxAttempts ?? current.maxAttempts,
                cooldownRemaining: response.resendCooldown ?? this.defaultResendCooldown,
                lastSentAt: new Date().toISOString(),
                message: response.message ?? this.buildChallengeMessage(current.channel, current.identifier),
            });

            this.startResendCooldown(response.resendCooldown ?? this.defaultResendCooldown);
        } catch (error) {
            const descriptor = this.mapApiErrorToUserMessage(error);
            if (descriptor.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: current.identifier,
                    channel: current.channel,
                    lockoutUntil: descriptor.lockoutUntil,
                    attemptCount: current.attemptCount,
                    message: descriptor.message,
                });
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: current.identifier,
                channel: current.channel,
                code: descriptor.code,
                message: descriptor.message,
                retryable: descriptor.retryable,
            });
        }
    }

    private async handleSubmitOtp(code: string): Promise<void> {
        const current = this.stateSignal();
        if (current.status !== 'CHALLENGE_SENT') {
            return;
        }
        const trimmed = code.trim();
        if (!trimmed) {
            this.stateSignal.set({
                ...current,
                message: 'Enter the code that was sent to you.',
            });
            return;
        }

        this.stateSignal.set({
            status: 'VERIFYING_OTP',
            identifier: current.identifier,
            channel: current.channel,
            challengeId: current.challengeId,
            attemptCount: current.attemptCount,
            maxAttempts: current.maxAttempts,
        });

        try {
            const response = await firstValueFrom(
                this.http.post<VerifyOtpResponse>(`${this.apiBase}/auth/passwordless/verify`, {
                    identifier: current.identifier,
                    channel: current.channel,
                    challengeId: current.challengeId,
                    code: trimmed,
                })
            );

            if (response.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: current.identifier,
                    channel: current.channel,
                    lockoutUntil: response.lockoutUntil,
                    attemptCount: current.attemptCount,
                    message: 'Too many attempts. Try again later.',
                });
                return;
            }

            if (response.mfaRequired && this.mfaEnabled) {
                this.stateSignal.set({
                    status: 'MFA_REQUIRED',
                    identifier: current.identifier,
                    channel: current.channel,
                    challengeId: current.challengeId,
                    mfaProviders: response.mfaProviders ?? ['totp'],
                    message: 'Additional verification is required to finish signing in.',
                });
                return;
            }

            if (response.session) {
                this.completeAuthentication(response.session, response.redirectUrl);
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: current.identifier,
                channel: current.channel,
                code: 'UNKNOWN',
                message: 'We could not verify the code. Please request a new one.',
                retryable: true,
            });
        } catch (error) {
            const descriptor = this.mapApiErrorToUserMessage(error);

            if (descriptor.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: current.identifier,
                    channel: current.channel,
                    lockoutUntil: descriptor.lockoutUntil,
                    attemptCount: current.attemptCount,
                    message: descriptor.message,
                });
                return;
            }

            if (descriptor.code === 'INVALID_OTP' || descriptor.code === 'EXPIRED_OTP') {
                const attempts = (current.attemptCount ?? 0) + 1;
                this.stateSignal.set({
                    status: 'CHALLENGE_SENT',
                    identifier: current.identifier,
                    channel: current.channel,
                    challengeId: current.challengeId,
                    attemptCount: descriptor.retryable ? attempts : attempts,
                    maxAttempts: current.maxAttempts,
                    cooldownRemaining: current.cooldownRemaining,
                    expiresAt: current.expiresAt,
                    lastSentAt: current.lastSentAt,
                    message: descriptor.message,
                });
                return;
            }

            if (descriptor.retryable) {
                this.stateSignal.set({
                    status: 'CHALLENGE_SENT',
                    identifier: current.identifier,
                    channel: current.channel,
                    challengeId: current.challengeId,
                    attemptCount: current.attemptCount,
                    maxAttempts: current.maxAttempts,
                    cooldownRemaining: current.cooldownRemaining,
                    expiresAt: current.expiresAt,
                    lastSentAt: current.lastSentAt,
                    message: descriptor.message,
                });
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: current.identifier,
                channel: current.channel,
                code: descriptor.code,
                message: descriptor.message,
                retryable: descriptor.retryable,
            });
        }
    }

    private async handleSubmitMfa(code: string, provider?: string): Promise<void> {
        const current = this.stateSignal();
        if (current.status !== 'MFA_REQUIRED') {
            return;
        }
        const trimmed = code.trim();
        if (!trimmed) {
            this.stateSignal.set({
                ...current,
                message: 'Enter the MFA code to continue.',
            });
            return;
        }

        const usedProvider = provider ?? current.mfaProviders[0];
        this.stateSignal.set({
            status: 'VERIFYING_MFA',
            identifier: current.identifier,
            channel: current.channel,
            challengeId: current.challengeId,
            mfaProvider: usedProvider,
        });

        try {
            const response = await firstValueFrom(
                this.http.post<VerifyMfaResponse>(`${this.apiBase}/auth/mfa/verify`, {
                    identifier: current.identifier,
                    challengeId: current.challengeId,
                    provider: usedProvider,
                    code: trimmed,
                })
            );

            if (response.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: current.identifier,
                    channel: current.channel,
                    lockoutUntil: response.lockoutUntil,
                    attemptCount: 0,
                    message: 'Too many attempts. Try again later.',
                });
                return;
            }

            if (response.session) {
                this.completeAuthentication(response.session, response.redirectUrl);
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: current.identifier,
                channel: current.channel,
                code: 'UNKNOWN',
                message: 'We could not verify the MFA challenge. Please retry.',
                retryable: true,
            });
        } catch (error) {
            const descriptor = this.mapApiErrorToUserMessage(error);
            if (descriptor.lockoutUntil) {
                this.stateSignal.set({
                    status: 'LOCKED_OUT',
                    identifier: current.identifier,
                    channel: current.channel,
                    lockoutUntil: descriptor.lockoutUntil,
                    attemptCount: 0,
                    message: descriptor.message,
                });
                return;
            }

            if (descriptor.retryable) {
                this.stateSignal.set({
                    ...current,
                    message: descriptor.message,
                });
                return;
            }

            this.stateSignal.set({
                status: 'ERROR',
                identifier: current.identifier,
                channel: current.channel,
                code: descriptor.code,
                message: descriptor.message,
                retryable: descriptor.retryable,
            });
        }
    }

    private completeAuthentication(session: AuthSession, redirectOverride?: string): void {
        this.clearCooldownTimer();
        this.authService.setSession(session);
        const redirect = sanitizeReturnUrl(this.router, redirectOverride ?? this.targetReturnUrl, this.defaultReturnUrl);
        this.stateSignal.set({
            status: 'AUTHENTICATED',
            redirectUrl: redirect,
        });
        this.router.navigateByUrl(redirect).finally(() => {
            setTimeout(() => this.transitionToCollect(), 0);
        });
    }

    private startResendCooldown(seconds: number): void {
        this.clearCooldownTimer();
        if (seconds <= 0) {
            this.patchChallengeState({ cooldownRemaining: 0 });
            return;
        }

        let remaining = seconds;
        this.patchChallengeState({ cooldownRemaining: remaining });
        this.cooldownTimer = setInterval(() => {
            remaining = Math.max(remaining - 1, 0);
            this.patchChallengeState({ cooldownRemaining: remaining });
            if (remaining === 0) {
                this.clearCooldownTimer();
            }
        }, 1000);
    }

    private patchChallengeState(patch: Partial<Extract<AuthFlowState, { status: 'CHALLENGE_SENT' }>>): void {
        this.stateSignal.update((state) => {
            if (state.status !== 'CHALLENGE_SENT') {
                return state;
            }
            return {
                ...state,
                ...patch,
            };
        });
    }

    private clearCooldownTimer(): void {
        if (this.cooldownTimer) {
            clearInterval(this.cooldownTimer);
            this.cooldownTimer = null;
        }
    }

    private buildChallengeMessage(channel: AuthChannel, identifier: string): string {
        const obfuscated = this.obfuscate(identifier);
        switch (channel) {
            case 'email_magic_link':
                return `We sent a sign-in link to ${obfuscated}. Check your inbox to continue.`;
            case 'sms_otp':
                return `We sent a verification code to ${obfuscated}. Enter it below to continue.`;
            case 'email_otp':
            default:
                return `We sent a verification code to ${obfuscated}. Enter it below to continue.`;
        }
    }

    private obfuscate(identifier: string): string {
        if (identifier.includes('@')) {
            const [user, domain] = identifier.split('@');
            if (!domain) {
                return identifier;
            }
            const visible = user.slice(0, 2);
            return `${visible}***@${domain}`;
        }
        if (identifier.length <= 4) {
            return '*'.repeat(identifier.length);
        }
        return `${'*'.repeat(identifier.length - 4)}${identifier.slice(-4)}`;
    }

    private mapApiErrorToUserMessage(error: unknown): AuthErrorDescriptor {
        const fallback: AuthErrorDescriptor = {
            code: 'UNKNOWN',
            message: 'Something went wrong. Please try again.',
            retryable: true,
        };

        if (!(error instanceof HttpErrorResponse)) {
            if (error instanceof Error) {
                console.error('[AuthFlow] unexpected error', error.message);
            }
            return fallback;
        }

        if (!navigator.onLine) {
            return {
                code: 'NETWORK_ERROR',
                message: 'We could not reach the server. Check your connection and try again.',
                retryable: true,
            };
        }

        const payload = error.error ?? {};
        const code: string = payload.code ?? error.statusText ?? 'UNKNOWN';
        const lockoutUntil: string | undefined = payload.lockoutUntil;

        const table: Record<string, AuthErrorDescriptor> = {
            INVALID_IDENTIFIER: {
                code: 'INVALID_IDENTIFIER',
                message: 'We could not find that account. Check the address and try again.',
                retryable: true,
            },
            INVALID_OTP: {
                code: 'INVALID_OTP',
                message: 'That code is incorrect. Try again.',
                retryable: true,
            },
            EXPIRED_OTP: {
                code: 'EXPIRED_OTP',
                message: 'That code expired. Request a new one.',
                retryable: true,
            },
            TOO_MANY_ATTEMPTS: {
                code: 'TOO_MANY_ATTEMPTS',
                message: 'Too many attempts. Try again later.',
                retryable: false,
                lockoutUntil,
            },
            LOCKED_OUT: {
                code: 'LOCKED_OUT',
                message: 'Your account is temporarily locked. Try again later.',
                retryable: false,
                lockoutUntil,
            },
            RATE_LIMITED: {
                code: 'RATE_LIMITED',
                message: 'We are sending codes too quickly. Please wait before trying again.',
                retryable: true,
            },
        };

        const descriptor = table[code];
        if (descriptor) {
            return descriptor;
        }

        if (error.status === 0) {
            return {
                code: 'NETWORK_ERROR',
                message: 'We could not reach the server. Check your connection and try again.',
                retryable: true,
            };
        }

        if (error.status >= 500) {
            return {
                code: 'SERVER_ERROR',
                message: 'The server is having trouble right now. Please try again soon.',
                retryable: true,
            };
        }

        if (payload?.message) {
            return {
                code,
                message: payload.message,
                retryable: true,
                lockoutUntil,
            };
        }

        return fallback;
    }
}
