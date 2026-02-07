import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantPostLoginRouter } from '../../../../core/tenant/tenant-post-login-router.service';
import { sanitizeReturnUrl } from '../../../../core/auth/return-url.util';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCheckboxComponent,
    MbCardComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbLogoComponent
} from '@mindbloom/ui';

type TenantDiscoveryMatch = 'none' | 'single' | 'multiple';

interface TenantDiscoveryTenant {
    tenantId: string;
    tenantSlug?: string;
    tenantName: string;
    logoUrl?: string;
    allowedAuthMethods?: string[];
}

interface TenantDiscoveryResult {
    match: TenantDiscoveryMatch;
    allowedAuthMethods: string[];
    tenants?: TenantDiscoveryTenant[];
    tenant?: TenantDiscoveryTenant;
}

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MbFormFieldComponent,
        MbInputComponent,
        MbCheckboxComponent,
        MbLogoComponent,
        MbButtonComponent,
        MbCardComponent,
        MbAlertComponent
    ],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss']
})
export class LoginOverlayComponent {
    @ViewChild('alertRef') alertRef?: ElementRef<HTMLDivElement>;

    username = signal('');
    password = signal('');
    showPassword = signal(false);
    rememberMe = signal(false);
    capsLockOn = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    resetSuccess = signal(false);
    emailTouched = signal(false);
    passwordTouched = signal(false);
    submitAttempted = signal(false);
    tenantDiscoveryLoading = signal(false);
    tenantDiscoveryError = signal('');
    tenantDiscoveryResult = signal<TenantDiscoveryResult | null>(null);
    selectedTenantId = signal<string | null>(null);
    currentStep = signal<'email' | 'auth-method'>('email');

    emailError = computed(() => {
        if (!this.shouldShowValidation()) {
            return '';
        }
        const value = this.username().trim();
        if (!value) {
            return 'Email is required.';
        }
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return valid ? '' : 'Enter a valid email address.';
    });

    passwordError = computed(() => {
        if (!this.shouldShowValidation()) {
            return '';
        }
        return this.password().trim() ? '' : 'Password is required.';
    });

    isFormValid = computed(() => !this.emailError() && !this.passwordError());

    activeTenant = computed(() => {
        const result = this.tenantDiscoveryResult();
        if (!result) return undefined;

        if (result.match === 'single') {
            return result.tenant;
        }

        if (result.match === 'multiple') {
            const selectedId = this.selectedTenantId();
            return result.tenants?.find(tenant => tenant.tenantId === selectedId);
        }

        return undefined;
    });

    availableAuthMethods = computed(() => {
        const result = this.tenantDiscoveryResult();
        if (!result) {
            return ['password'];
        }

        const tenant = this.activeTenant();
        if (tenant?.allowedAuthMethods?.length) {
            return tenant.allowedAuthMethods;
        }

        return result.allowedAuthMethods.length ? result.allowedAuthMethods : ['password'];
    });

    isPasswordSubmitDisabled = computed(() => {
        return this.tenantDiscoveryResult()?.match === 'multiple'
            ? !this.selectedTenantId() || this.isLoading()
            : this.isLoading();
    });

    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    constructor(
        private authService: AuthService,
        private tenantPostLoginRouter: TenantPostLoginRouter,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.route.queryParamMap.subscribe(params => {
            this.resetSuccess.set(params.get('reset') === 'success');
            this.targetAfterLogin = sanitizeReturnUrl(
                this.router,
                params.get('returnUrl'),
                this.defaultReturnUrl
            );
        });
    }

    selectTenant(tenantId: string): void {
        this.selectedTenantId.set(tenantId);
    }

    backToEmailStep(): void {
        this.currentStep.set('email');
        this.selectedTenantId.set(null);
        this.tenantDiscoveryResult.set(null);
        this.tenantDiscoveryError.set('');
        this.isLoading.set(false);
        this.password.set('');
        this.passwordTouched.set(false);
        this.submitAttempted.set(false);
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onEmailBlur(): void {
        this.emailTouched.set(true);
    }

    onPasswordBlur(): void {
        this.passwordTouched.set(true);
    }

    handleCapsLock(event: KeyboardEvent): void {
        this.capsLockOn.set(event.getModifierState?.('CapsLock') ?? false);
    }

    handleEmailContinue(): void {
        this.emailTouched.set(true);
        this.tenantDiscoveryError.set('');

        if (this.emailError()) {
            return;
        }

        const email = this.username().trim();
        if (!email) {
            return;
        }

        this.tenantDiscoveryLoading.set(true);
        this.authService.tenantDiscovery(email).subscribe({
            next: (result) => {
                this.tenantDiscoveryLoading.set(false);
                this.tenantDiscoveryResult.set(result);
                if (result.match === 'single' && result.tenant) {
                    this.selectedTenantId.set(result.tenant.tenantId);
                } else {
                    this.selectedTenantId.set(null);
                }
                this.currentStep.set('auth-method');
            },
            error: () => {
                this.tenantDiscoveryLoading.set(false);
                this.tenantDiscoveryError.set('Unable to detect your workspace. Please try again.');
            }
        });
    }

    onSubmit(): void {
        this.submitAttempted.set(true);
        if (!this.username().trim() || !this.password()) {
            this.errorMessage.set('We couldn’t sign you in. Check your details and try again.');
            this.focusAlert();
            return;
        }
        if (!this.isFormValid()) {
            return;
        }

        const tenantId = this.getEffectiveTenantId();
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.login(this.username(), this.password(), tenantId).subscribe({
            next: async () => {
                this.isLoading.set(false);

                const session = this.authService.session();
                if (session?.mode === 'host') {
                    await this.router.navigateByUrl('/host');
                    return;
                }

                if (session?.memberships) {
                    await this.tenantPostLoginRouter.route(session.memberships, this.targetAfterLogin);
                } else {
                    this.router.navigateByUrl(this.targetAfterLogin);
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set(error?.error?.message || 'We couldn’t sign you in. Check your details and try again.');
                this.password.set('');
                this.passwordTouched.set(false);
                this.focusAlert();
                setTimeout(() => this.focusPassword(), 0);
            }
        });
    }

    private focusAlert(): void {
        setTimeout(() => this.alertRef?.nativeElement?.focus(), 0);
    }

    private focusPassword(): void {
        const input = document.getElementById('login-password') as HTMLInputElement | null;
        if (input) {
            input.focus();
        }
    }

    private shouldShowValidation(): boolean {
        return this.submitAttempted() || this.emailTouched() || this.passwordTouched();
    }

    private getEffectiveTenantId(): string | null {
        const result = this.tenantDiscoveryResult();
        if (!result) {
            return null;
        }

        if (result.match === 'single') {
            return result.tenant?.tenantId ?? null;
        }

        if (result.match === 'multiple') {
            return this.selectedTenantId();
        }

        return null;
    }

    formatAuthMethod(method: string): string {
        switch (method.toLowerCase()) {
            case 'password':
                return 'Password';
            case 'google':
                return 'Google SSO';
            case 'microsoft':
                return 'Microsoft SSO';
            case 'saml':
                return 'SAML';
            default:
                return method.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        }
    }
}
