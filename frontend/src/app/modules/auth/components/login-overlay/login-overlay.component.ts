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
    
    // Tenant editing state
    isEditingTenant = signal(false);
    tenantEditValue = signal('');

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
        // Enter edit mode
        this.tenantEditValue.set(this.currentTenant);
        this.isEditingTenant.set(true);
        
        // Focus the input after a short delay to allow the DOM to update
        setTimeout(() => {
            const input = document.querySelector('.tenant-edit-input') as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    onSaveTenant(): void {
        const newTenantName = this.tenantEditValue().trim();
        if (newTenantName) {
            // In a real app, you'd fetch a new tenant by subdomain or ID
            // For now, we'll just log the change
            console.log('Tenant change requested:', newTenantName);
            
            // Update the tenant service (simplified version)
            const currentTenant = this.tenantService.getCurrentTenantValue();
            if (currentTenant) {
                // Keep the existing tenant but update the name (simplified)
                this.tenantService.setTenant({
                    ...currentTenant,
                    name: newTenantName
                });
            }
        }
        this.isEditingTenant.set(false);
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
