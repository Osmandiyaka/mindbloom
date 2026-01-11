import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { TenantPostLoginRouter } from '../../../../core/tenant/tenant-post-login-router.service';
import { TenantRegistrationComponent } from '../tenant-registration/tenant-registration.component';
import { sanitizeReturnUrl } from '../../../../core/auth/return-url.util';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCheckboxComponent,
    MbCardComponent,
    MbFormFieldComponent,
    MbInputComponent
} from '@mindbloom/ui';

type TenantStep = 'select' | 'login';
type SsoMode = 'password' | 'password+sso' | 'sso-only';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TenantRegistrationComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbCheckboxComponent,
        MbButtonComponent,
        MbCardComponent,
        MbAlertComponent
    ],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss']
})
export class LoginOverlayComponent {
    @ViewChild('alertRef') alertRef?: ElementRef<HTMLDivElement>;
    @ViewChild('firstFieldRef', { read: ElementRef }) firstFieldRef?: ElementRef<HTMLElement>;

    username = signal('');
    password = signal('');
    showPassword = signal(false);
    rememberMe = signal(false);
    capsLockOn = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    resetSuccess = signal(false);
    tenantStep = signal<TenantStep>('select');
    organizationQuery = signal('');
    tenantCode = signal('');
    showTenantCode = signal(false);
    isValidatingTenant = signal(false);
    tenantErrorMessage = signal('');
    tenantName = signal('');
    tenantLocked = signal(false);
    ssoMode = signal<SsoMode>('password');

    showRegistration = signal(false);
    private readonly tenantStorageKey = 'mb_tenant_selection';
    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
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

        const storedTenant = this.loadStoredTenant();
        const activeTenant = this.tenantService.getCurrentTenantValue();

        if (activeTenant?.subdomain) {
            this.tenantStep.set('login');
            this.tenantCode.set(activeTenant.subdomain);
            this.tenantName.set(activeTenant.name || activeTenant.subdomain);
            this.tenantLocked.set(!storedTenant);
        } else if (storedTenant?.code) {
            this.tenantStep.set('login');
            this.tenantCode.set(storedTenant.code);
            this.tenantName.set(storedTenant.name || storedTenant.code);
        }
    }

    onConfirmTenant(): void {
        const query = this.organizationQuery().trim();
        if (!query) {
            this.tenantErrorMessage.set('Enter your organization or tenant code.');
            this.focusAlert();
            return;
        }
        this.resolveTenant(query);
    }

    onConfirmTenantCode(): void {
        const code = this.tenantCode().trim();
        if (!code) {
            this.tenantErrorMessage.set('Enter your tenant URL or code.');
            this.focusAlert();
            return;
        }
        this.resolveTenant(code);
    }

    onTenantKeyDown(event: KeyboardEvent, type: 'org' | 'code'): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (type === 'org') {
                this.onConfirmTenant();
            } else {
                this.onConfirmTenantCode();
            }
        }
    }

    onChangeTenant(): void {
        if (this.tenantLocked()) {
            return;
        }
        this.tenantStep.set('select');
        this.tenantErrorMessage.set('');
        this.clearStoredTenantSelection();
        setTimeout(() => this.focusFirstField(), 0);
    }

    toggleTenantCode(): void {
        this.showTenantCode.update(value => !value);
        this.tenantErrorMessage.set('');
        setTimeout(() => this.focusFirstField(), 0);
    }

    onRegisterTenant(event: Event): void {
        event.preventDefault();
        this.showRegistration.set(true);
    }

    onRegistrationCancelled(): void {
        this.showRegistration.set(false);
    }

    onRegistrationCompleted(data: { tenantId: string; subdomain: string }): void {
        this.showRegistration.set(false);
        this.tenantStep.set('login');
        this.tenantCode.set(data.subdomain);
        this.tenantLocked.set(true);
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    handleCapsLock(event: KeyboardEvent): void {
        this.capsLockOn.set(event.getModifierState?.('CapsLock') ?? false);
    }

    onSubmit(): void {
        if (this.ssoMode() === 'sso-only') {
            return;
        }
        if (!this.username().trim() || !this.password()) {
            this.errorMessage.set('We couldn’t sign you in. Check your details and try again.');
            this.focusAlert();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const selectedTenant = this.tenantService.getCurrentTenantValue();
        const tenantId = selectedTenant?.id ?? undefined;

        this.authService.login(this.username(), this.password(), tenantId).subscribe({
            next: async () => {
                this.isLoading.set(false);
                if (selectedTenant) {
                    const storedCode = selectedTenant.subdomain || this.tenantCode().trim();
                    const storedName = selectedTenant.name || this.tenantName();
                    if (storedCode) {
                        this.storeTenantSelection(storedCode, storedName);
                    }
                }

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
                this.focusAlert();
            }
        });
    }

    onSsoContinue(): void {
        this.errorMessage.set('SSO has not been configured for this tenant yet.');
        this.focusAlert();
    }

    private resolveTenant(tenantCode: string): void {
        this.isValidatingTenant.set(true);
        this.tenantErrorMessage.set('');

        this.tenantService.getTenantByCode(tenantCode).subscribe({
            next: (tenant) => {
                this.isValidatingTenant.set(false);
                if (tenant) {
                    this.tenantStep.set('login');
                    this.tenantCode.set(tenantCode);
                    this.tenantName.set(tenant?.name || tenantCode);
                    this.tenantLocked.set(false);
                    this.storeTenantSelection(tenantCode, this.tenantName());
                    setTimeout(() => this.focusFirstField(), 0);
                } else {
                    this.tenantErrorMessage.set('We couldn’t find that organization.');
                    this.focusAlert();
                }
            },
            error: () => {
                this.isValidatingTenant.set(false);
                this.tenantErrorMessage.set('We couldn’t find that organization. Try again or use your tenant URL.');
                this.focusAlert();
            }
        });
    }

    private storeTenantSelection(code: string, name?: string): void {
        try {
            localStorage.setItem(this.tenantStorageKey, JSON.stringify({ code, name }));
        } catch (err) {
            console.warn('Failed to store tenant selection', err);
        }
    }

    private loadStoredTenant(): { code: string; name?: string } | null {
        try {
            const raw = localStorage.getItem(this.tenantStorageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.warn('Failed to load stored tenant selection', err);
            return null;
        }
    }

    private clearStoredTenantSelection(): void {
        try {
            localStorage.removeItem(this.tenantStorageKey);
        } catch (err) {
            console.warn('Failed to clear stored tenant selection', err);
        }
    }

    private focusAlert(): void {
        setTimeout(() => this.alertRef?.nativeElement?.focus(), 0);
    }

    private focusFirstField(): void {
        const host = this.firstFieldRef?.nativeElement;
        const input = host?.querySelector('input') as HTMLInputElement | null;
        if (input) {
            input.focus();
        }
    }
}
