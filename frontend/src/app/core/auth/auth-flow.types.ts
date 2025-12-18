export type AuthChannel = 'email_magic_link' | 'email_otp' | 'sms_otp';

export type AuthFlowState =
    | {
        status: 'INIT';
        availableChannels: AuthChannel[];
        preferredChannel: AuthChannel;
    }
    | {
        status: 'COLLECT_IDENTIFIER';
        identifier: string;
        channel: AuthChannel;
        availableChannels: AuthChannel[];
        errorMessage?: string;
    }
    | {
        status: 'REQUESTING_CHALLENGE';
        identifier: string;
        channel: AuthChannel;
        availableChannels: AuthChannel[];
    }
    | {
        status: 'CHALLENGE_SENT';
        identifier: string;
        channel: AuthChannel;
        challengeId: string;
        attemptCount: number;
        maxAttempts?: number;
        cooldownRemaining: number;
        expiresAt?: string;
        lastSentAt: string;
        message?: string;
    }
    | {
        status: 'VERIFYING_OTP';
        identifier: string;
        channel: AuthChannel;
        challengeId: string;
        attemptCount: number;
        maxAttempts?: number;
    }
    | {
        status: 'MFA_REQUIRED';
        identifier: string;
        channel: AuthChannel;
        challengeId: string;
        mfaProviders: string[];
        message?: string;
    }
    | {
        status: 'VERIFYING_MFA';
        identifier: string;
        channel: AuthChannel;
        challengeId: string;
        mfaProvider: string;
    }
    | {
        status: 'AUTHENTICATED';
        redirectUrl: string;
    }
    | {
        status: 'LOCKED_OUT';
        identifier: string;
        channel: AuthChannel;
        lockoutUntil: string;
        attemptCount: number;
        message: string;
    }
    | {
        status: 'ERROR';
        identifier?: string;
        channel?: AuthChannel;
        code: string;
        message: string;
        retryable: boolean;
    };

export type AuthFlowEvent =
    | { type: 'RESET' }
    | { type: 'CANCEL' }
    | { type: 'SUBMIT_IDENTIFIER'; identifier: string; channel: AuthChannel }
    | { type: 'CHOOSE_CHANNEL'; channel: AuthChannel }
    | { type: 'RESEND' }
    | { type: 'SUBMIT_OTP'; code: string }
    | { type: 'SUBMIT_MFA'; code: string; provider?: string };

export interface AuthErrorDescriptor {
    code: string;
    message: string;
    retryable: boolean;
    lockoutUntil?: string;
}
