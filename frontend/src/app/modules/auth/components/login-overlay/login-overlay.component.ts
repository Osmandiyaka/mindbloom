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
import { UiFormFieldComponent, UiInputComponent, UiFormHintComponent, UiCheckboxComponent } from '../../../../shared/ui/forms';
import { UiButtonComponent } from '../../../../shared/ui/buttons';
import { UiInlineIconComponent } from '../../../../shared/ui/icons';
import { UiSpinnerComponent } from '../../../../shared/ui/feedback';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TenantRegistrationComponent,
        UiFormFieldComponent,
        UiFormHintComponent,
        UiInputComponent,
        UiCheckboxComponent,
        UiButtonComponent,
        UiInlineIconComponent,
        UiSpinnerComponent
    ],
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
    tenantStep = signal<'select' | 'login'>('select');
    schoolCode = signal('');
    private readonly tenantStorageKey = 'mb_tenant_selection';

    isValidatingTenant = signal(false);
    tenantErrorMessage = signal('');

    // Registration state
    showRegistration = signal(false);
    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    isEditingTenant = signal(false);
    tempSchoolCode = signal('');
    tenantName = signal('');

    // Add these new methods

    // onChangeTenant() {
    //   this.tempSchoolCode.set(this.schoolCode());
    //   this.isEditingTenant.set(true);
    // }

    onConfirmTenantEdit() {
        if (this.tempSchoolCode().trim()) {
            // Call your existing tenant validation logic
            this.schoolCode.set(this.tempSchoolCode());
            this.onConfirmTenant(); // Call your existing method
        }
    }

    onCancelTenantEdit() {
        this.tempSchoolCode.set('');
        this.isEditingTenant.set(false);
    }

    onSchoolCodeEditKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onConfirmTenantEdit();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.onCancelTenantEdit();
        }
    }

    // Modify your existing onConfirmTenant to also update tenantName and reset edit mode
    // Example (adjust based on your existing implementation):
    /*
    async onConfirmTenant() {
      // Your existing validation logic...
      // After successful validation:
      this.tenantName.set(response.schoolName || `${this.schoolCode()} School`);
      this.isEditingTenant.set(false);
      this.tenantStep.set('login');
    }
    */

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

        const storedTenant = this.loadStoredTenant();
        if (storedTenant?.code) {
            this.schoolCode.set(storedTenant.code);
            this.tenantName.set(storedTenant.name || '');
            this.tenantStep.set('login');
        }

    }

    get currentTenant(): string {
        const tenant = this.tenantService.getCurrentTenantValue();
        return tenant?.name || 'No Tenant Selected';
    }

    onChangeTenant(): void {
        this.tenantStep.set('select');
        this.clearStoredTenantSelection();
    }

    onConfirmTenant(): void {
        const tenantCode = this.schoolCode().trim();
        if (!tenantCode) {
            this.tenantErrorMessage.set('Please enter a school code');
            return;
        }

        this.validateTenantCode(tenantCode, (tenant) => {
            const name = tenant?.name || tenant?.label || '';
            this.tenantStep.set('login');
            this.schoolCode.set(tenantCode);
            this.tenantName.set(name);
            this.storeTenantSelection(tenantCode, name);
        });
    }

    onSchoolCodeKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onConfirmTenant();
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

        const selectedTenant = this.tenantService.getCurrentTenantValue();
        // Tenant model uses `id` (not tenantId) — send selected tenant id when in tenant mode
        const tenantId = selectedTenant?.id ?? undefined;

        this.authService.login(this.username(), this.password(), tenantId).subscribe({
            next: async (response) => {
                this.isLoading.set(false);

                const session = this.authService.session();
                if (selectedTenant) {
                    const storedCode = selectedTenant.subdomain || this.schoolCode().trim();
                    const storedName = selectedTenant.name || this.tenantName();
                    if (storedCode) {
                        this.storeTenantSelection(storedCode, storedName);
                    }
                }

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

    private validateTenantCode(tenantCode: string, onSuccess: (tenant: any) => void): void {
        this.isValidatingTenant.set(true);
        this.tenantErrorMessage.set('');

        this.tenantService.getTenantByCode(tenantCode).subscribe({
            next: (tenant) => {
                this.isValidatingTenant.set(false);
                if (tenant) {
                    onSuccess(tenant);
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

    private storeTenantSelection(code: string, name?: string) {
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

    clearStoredTenantSelection() {
        try {
            localStorage.removeItem(this.tenantStorageKey);
        } catch (err) {
            console.warn('Failed to clear stored tenant selection', err);
        }
    }
}
