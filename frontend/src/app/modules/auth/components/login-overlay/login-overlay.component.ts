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
        return this.tenantService.getCurrentTenant();
    }

    onChangeTenant(): void {
        // For now, just show an alert. You can implement a modal later
        const newTenant = prompt('Enter school code:', this.currentTenant);
        if (newTenant && newTenant.trim()) {
            this.tenantService.setTenant(newTenant.trim());
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
