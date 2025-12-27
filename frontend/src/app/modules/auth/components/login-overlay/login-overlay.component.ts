import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { TenantPostLoginRouter } from '../../../../core/tenant/tenant-post-login-router.service';
import { TenantRegistrationComponent } from '../tenant-registration/tenant-registration.component';
import { sanitizeReturnUrl } from '../../../../core/auth/return-url.util';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TenantRegistrationComponent],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss'],
    animations: [
        trigger('stepFadeUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(18px)' }),
                animate('420ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('240ms ease-in', style({ opacity: 0, transform: 'translateY(12px)' }))
            ])
        ]),
        trigger('heroStagger', [
            transition(':enter', [
                query(
                    '.hero-animate',
                    [
                        style({ opacity: 0, transform: 'translateX(-24px)' }),
                        stagger(140, animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })))
                    ],
                    { optional: true }
                )
            ])
        ])
    ]
})
export class LoginOverlayComponent {
    username = signal('');
    password = signal('');
    showPassword = signal(false);
    rememberMe = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    resetSuccess = signal(false);
    loginMode = signal<'tenant' | 'host'>('tenant');
    tenantStep = signal<'select' | 'login'>('select');
    schoolCode = signal('');

    // Tenant editing state
    isEditingTenant = signal(false);
    tenantEditValue = signal('');
    isValidatingTenant = signal(false);
    tenantErrorMessage = signal('');

    // Registration state
    showRegistration = signal(false);
    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    get currentTenantCode(): string {
        const tenant: any = this.tenantService.getCurrentTenantValue();
        return tenant?.subdomain || tenant?.code || '—';
    }

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

        const hasTenant = !!this.tenantService.getCurrentTenantValue();
        this.tenantStep.set(hasTenant ? 'login' : 'select');
    }

    get currentTenant(): string {
        if (this.loginMode() === 'host') {
            return 'Host context';
        }
        const tenant = this.tenantService.getCurrentTenantValue();
        return tenant?.name || 'No Tenant Selected';
    }

    setMode(mode: 'tenant' | 'host'): void {
        this.loginMode.set(mode);
        if (mode === 'host') {
            this.isEditingTenant.set(false);
            this.tenantErrorMessage.set('');
            this.tenantStep.set('login');
        } else if (!this.tenantService.getCurrentTenantValue()) {
            this.tenantStep.set('select');
        }
    }

    onChangeTenant(): void {
        if (this.loginMode() === 'host') {
            return;
        }
        // Clear any previous tenant error
        this.tenantErrorMessage.set('');

        // Enter edit mode - prefill with current tenant code when available
        const tenantCode = this.currentTenantCode;
        this.tenantEditValue.set(tenantCode === '—' ? '' : tenantCode);
        this.isEditingTenant.set(true);

        // Focus the input after a short delay to allow the DOM to update
        setTimeout(() => {
            const input = document.querySelector('.tenant-edit-input') as HTMLInputElement;
            if (input) {
                input.focus();
            }
        }, 50);
    }

    onConfirmTenant(): void {
        const tenantCode = this.schoolCode().trim();
        if (!tenantCode) {
            this.tenantErrorMessage.set('Please enter a school code');
            return;
        }

        this.validateTenantCode(tenantCode, () => {
            this.tenantStep.set('login');
            this.schoolCode.set('');
        });
    }

    onSaveTenant(): void {
        const tenantCode = this.tenantEditValue().trim();
        if (!tenantCode) {
            this.tenantErrorMessage.set('Please enter a school code');
            return;
        }

        this.validateTenantCode(tenantCode, () => {
            this.isEditingTenant.set(false);
            this.tenantEditValue.set('');
        });
    }

    onCancelTenantEdit(): void {
        this.isEditingTenant.set(false);
        this.tenantEditValue.set('');
    }

    onSchoolCodeKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onConfirmTenant();
        }
    }

    onTenantKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onSaveTenant();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.onCancelTenantEdit();
        }
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
        // Tenant is already set by the service, just show success message
        this.isEditingTenant.set(false);
        this.tenantEditValue.set('');
        this.tenantStep.set('login');
    }

    togglePassword() {
        this.showPassword.update(v => !v);
    }

    goToForgot() {
        this.router.navigateByUrl('/auth/forgot');
    }

    onSubmit(): void {
        if (!this.username() || !this.password()) {
            this.errorMessage.set('Please enter username and password');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        // If tenant mode is selected, include the selected tenantId
        const selectedTenant = this.tenantService.getCurrentTenantValue();
        // Tenant model uses `id` (not tenantId) — send selected tenant id when in tenant mode
        const tenantId = this.loginMode() === 'tenant' ? selectedTenant?.id ?? undefined : undefined;

        this.authService.login(this.username(), this.password(), tenantId).subscribe({
            next: async (response) => {
                this.isLoading.set(false);

                const session = this.authService.session();

                if (session?.mode === 'host') {
                    await this.router.navigateByUrl('/host');
                    return;
                }

                // Use tenant post-login router to handle routing based on memberships
                if (session?.memberships) {
                    await this.tenantPostLoginRouter.route(session.memberships, this.targetAfterLogin);
                } else {
                    // Fallback to default behavior
                    this.router.navigateByUrl(this.targetAfterLogin);
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set(error?.error?.message || 'Invalid username or password');
            }
        });
    }

    private validateTenantCode(tenantCode: string, onSuccess: () => void): void {
        this.isValidatingTenant.set(true);
        this.tenantErrorMessage.set('');

        this.tenantService.getTenantByCode(tenantCode).subscribe({
            next: (tenant) => {
                this.isValidatingTenant.set(false);
                if (tenant) {
                    onSuccess();
                } else {
                    this.tenantErrorMessage.set('School code not found');
                }
            },
            error: () => {
                this.isValidatingTenant.set(false);
                this.tenantErrorMessage.set('School code not found. Please check and try again.');
            }
        });
    }
}
