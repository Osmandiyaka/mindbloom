import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, Tenant, TenantPlan } from '../../../../core/services/tenant.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-tenant-registration',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tenant-registration.component.html',
    styleUrls: ['./tenant-registration.component.scss']
})
export class TenantRegistrationComponent {
    currentStep = signal(1);
    schoolName = signal('');
    schoolCode = signal('');
    contactPerson = signal('');
    email = signal('');
    adminName = signal('');
    adminEmail = signal('');
    adminPassword = signal('');
    adminPasswordConfirm = signal('');
    phone = signal('');
    selectedPlan = signal<TenantPlan>('trial');
    acceptTerms = signal(false);
    codeStatus = signal<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    codeStatusMessage = signal('');
    
    isRegistering = signal(false);
    errorMessage = signal('');
    private codeCheckTimer: any = null;
    private codeSuggestionCounter = 0;
    
    // Output event when registration is cancelled or completed
    cancelled = output<void>();
    registered = output<{ tenantId: string; subdomain: string }>();

    constructor(private tenantService: TenantService) { }

    onCancel(): void {
        this.cancelled.emit();
    }

    onSubmit(): void {
        const password = this.adminPassword().trim();

        if (!this.acceptTerms()) {
            this.errorMessage.set('Please accept the terms to continue');
            return;
        }

        this.isRegistering.set(true);
        this.errorMessage.set('');

        // Create tenant
        const tenantData = {
            name: this.schoolName(),
            subdomain: this.schoolCode(),
            contactEmail: this.email(),
            adminName: this.adminName(),
            adminEmail: this.adminEmail(),
            adminPassword: password,
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

    // Step navigation with validation
    nextStep(): void {
        this.errorMessage.set('');
        const step = this.currentStep();
        if (step === 1) {
            if (!this.schoolName().trim()) return this.errorMessage.set('Please enter school name');
            if (!this.schoolCode().trim()) return this.errorMessage.set('Please enter school code');
            const codeRegex = /^[a-z0-9-]+$/;
            if (!codeRegex.test(this.schoolCode())) return this.errorMessage.set('Use lowercase letters, numbers, and hyphens only');
            if (this.codeStatus() === 'taken') return this.errorMessage.set('School code is already in use');
            if (!this.email().trim()) return this.errorMessage.set('Please enter contact email');
        }
        if (step === 2) {
            if (!this.adminName().trim()) return this.errorMessage.set('Please enter admin full name');
            if (!this.adminEmail().trim()) return this.errorMessage.set('Please enter admin email');
            const pwd = this.adminPassword().trim();
            if (pwd.length < 8) return this.errorMessage.set('Admin password must be at least 8 characters');
            if (pwd !== this.adminPasswordConfirm().trim()) return this.errorMessage.set('Admin passwords do not match');
        }
        if (this.currentStep() < 3) {
            this.currentStep.set(this.currentStep() + 1);
        }
    }

    prevStep(): void {
        this.errorMessage.set('');
        if (this.currentStep() > 1) {
            this.currentStep.set(this.currentStep() - 1);
        }
    }

    generateSchoolCode(): void {
        const name = this.schoolName().trim();
        if (!name) return;

        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '') || 'school';

        this.codeSuggestionCounter += 1;
        const randomChunk = Math.random().toString(36).substring(2, 5).padEnd(3, '0');
        const suggestion = `${baseSlug}-${randomChunk}${this.codeSuggestionCounter}`;

        this.onSchoolCodeInput(suggestion);
    }

    onSchoolCodeInput(value: string): void {
        const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        this.schoolCode.set(normalized);
        this.codeStatus.set('idle');
        this.codeStatusMessage.set('');

        if (!normalized) return;

        this.codeStatus.set('checking');
        if (this.codeCheckTimer) {
            clearTimeout(this.codeCheckTimer);
        }
        this.codeCheckTimer = setTimeout(() => {
            this.tenantService.getTenantBySubdomain(normalized).subscribe({
                next: () => {
                    this.codeStatus.set('taken');
                    this.codeStatusMessage.set('Code is already taken');
                },
                error: (err: HttpErrorResponse) => {
                    if (err.status === 404) {
                        this.codeStatus.set('available');
                        this.codeStatusMessage.set('Code is available');
                    } else {
                        this.codeStatus.set('error');
                        this.codeStatusMessage.set('Could not verify code');
                    }
                }
            });
        }, 350);
    }

    // Password strength helpers
    meetsLength(): boolean { return this.adminPassword().trim().length >= 8; }
    meetsUpper(): boolean { return /[A-Z]/.test(this.adminPassword()); }
    meetsNumberOrSymbol(): boolean { return /[0-9]|[^A-Za-z0-9]/.test(this.adminPassword()); }
}
