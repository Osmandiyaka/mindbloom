import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, Tenant, TenantPlan } from '../../../../core/services/tenant.service';

@Component({
    selector: 'app-tenant-registration',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tenant-registration.component.html',
    styleUrls: ['./tenant-registration.component.scss']
})
export class TenantRegistrationComponent {
    schoolName = signal('');
    schoolCode = signal('');
    contactPerson = signal('');
    email = signal('');
    phone = signal('');
    selectedPlan = signal<TenantPlan>('trial');
    
    isRegistering = signal(false);
    errorMessage = signal('');
    
    // Output event when registration is cancelled or completed
    cancelled = output<void>();
    registered = output<{ tenantId: string; subdomain: string }>();

    constructor(private tenantService: TenantService) { }

    onCancel(): void {
        this.cancelled.emit();
    }

    onSubmit(): void {
        // Validate form
        if (!this.schoolName().trim()) {
            this.errorMessage.set('Please enter school name');
            return;
        }

        if (!this.schoolCode().trim()) {
            this.errorMessage.set('Please enter school code');
            return;
        }

        if (!this.email().trim()) {
            this.errorMessage.set('Please enter email address');
            return;
        }

        // Validate school code format (alphanumeric, no spaces)
        const codeRegex = /^[a-z0-9-]+$/;
        if (!codeRegex.test(this.schoolCode())) {
            this.errorMessage.set('School code must be lowercase letters, numbers, and hyphens only');
            return;
        }

        this.isRegistering.set(true);
        this.errorMessage.set('');

        // Create tenant
        const tenantData = {
            name: this.schoolName(),
            subdomain: this.schoolCode(),
            contactEmail: this.email(),
            plan: this.selectedPlan(),
        };

        this.tenantService.createTenant(tenantData).subscribe({
            next: (tenant: Tenant) => {
                this.isRegistering.set(false);
                this.registered.emit({ 
                    tenantId: tenant.id, 
                    subdomain: tenant.subdomain 
                });
            },
            error: (error: any) => {
                this.isRegistering.set(false);
                this.errorMessage.set(
                    error.error?.message || 'Registration failed. This school code may already be taken.'
                );
            }
        });
    }

    selectPlan(plan: TenantPlan): void {
        this.selectedPlan.set(plan);
    }
}
