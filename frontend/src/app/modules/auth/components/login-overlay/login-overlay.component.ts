import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { TenantRegistrationComponent } from '../tenant-registration/tenant-registration.component';
import { sanitizeReturnUrl } from '../../../../core/auth/return-url.util';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TenantRegistrationComponent],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss']
})
export class LoginOverlayComponent {
    username = signal('');
    password = signal('');
    showPassword = signal(false);
    rememberMe = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    resetSuccess = signal(false);

    // Tenant editing state
    isEditingTenant = signal(false);
    tenantEditValue = signal('');
    isValidatingTenant = signal(false);
    tenantErrorMessage = signal('');

    // Registration state
    showRegistration = signal(false);
    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
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

    get currentTenant(): string {
        const tenant = this.tenantService.getCurrentTenantValue();
        return tenant?.name || 'No Tenant Selected';
    }

    onChangeTenant(): void {
        // Clear any previous tenant error
        this.tenantErrorMessage.set('');

        // Enter edit mode - clear the field for new input
        this.tenantEditValue.set('');
        this.isEditingTenant.set(true);

        // Focus the input after a short delay to allow the DOM to update
        setTimeout(() => {
            const input = document.querySelector('.tenant-edit-input') as HTMLInputElement;
            if (input) {
                input.focus();
            }
        }, 50);
    }

    onSaveTenant(): void {
        const tenantCode = this.tenantEditValue().trim();
        if (!tenantCode) {
            this.tenantErrorMessage.set('Please enter a school code');
            return;
        }

        // Validate tenant from backend
        this.isValidatingTenant.set(true);
        this.tenantErrorMessage.set('');

        this.tenantService.getTenantByCode(tenantCode).subscribe({
            next: (tenant) => {
                this.isValidatingTenant.set(false);
                if (tenant) {
                    // Tenant found and automatically set by the service
                    this.isEditingTenant.set(false);
                    this.tenantEditValue.set('');
                } else {
                    this.tenantErrorMessage.set('School code not found');
                }
            },
            error: (error) => {
                this.isValidatingTenant.set(false);
                this.tenantErrorMessage.set('School code not found. Please check and try again.');
            }
        });
    }

    onCancelTenantEdit(): void {
        this.isEditingTenant.set(false);
        this.tenantEditValue.set('');
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

        this.authService.login(this.username(), this.password()).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.router.navigateByUrl(this.targetAfterLogin);
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Invalid username or password');
            }
        });
    }
}
