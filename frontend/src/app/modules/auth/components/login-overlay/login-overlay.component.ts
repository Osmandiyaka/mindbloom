import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss']
})
export class LoginOverlayComponent {
    username = signal('');
    password = signal('');
    rememberMe = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
        private router: Router
    ) { }

    get currentTenant(): string {
        const tenant = this.tenantService.getCurrentTenantValue();
        return tenant?.name || 'No Tenant Selected';
    }

    onChangeTenant(): void {
        // For now, just show an alert. You can implement a modal later
        const newTenantName = prompt('Enter school name:', this.currentTenant);
        if (newTenantName && newTenantName.trim()) {
            // This is a simplified version - in production, you'd fetch the tenant from the backend
            // For now, we'll just update the display name
            const currentTenant = this.tenantService.getCurrentTenantValue();
            if (currentTenant) {
                // Keep the existing tenant but update the name (simplified)
                // In a real app, you'd fetch a new tenant by subdomain or ID
                console.log('Tenant change requested:', newTenantName);
            }
        }
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
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Invalid username or password');
            }
        });
    }
}
