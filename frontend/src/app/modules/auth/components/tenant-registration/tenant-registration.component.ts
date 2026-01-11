import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TenantService, Tenant, TenantEdition, TenantPlan } from '../../../../core/services/tenant.service';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCheckboxComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbSelectComponent
} from '@mindbloom/ui';

@Component({
    selector: 'app-tenant-registration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MbFormFieldComponent,
        MbInputComponent,
        MbSelectComponent,
        MbCheckboxComponent,
        MbButtonComponent,
        MbAlertComponent
    ],
    templateUrl: './tenant-registration.component.html',
    styleUrls: ['./tenant-registration.component.scss']
})
export class TenantRegistrationComponent {
    currentStep = signal(1);
    schoolName = signal('');
    schoolCode = signal('');
    country = signal('');
    timezone = signal(this.defaultTimeZone());
    schoolType = signal('');
    email = signal('');
    adminName = signal('');
    adminEmail = signal('');
    adminPassword = signal('');
    adminPasswordConfirm = signal('');
    acceptTerms = signal(false);
    codeStatus = signal<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    codeStatusMessage = signal('');
    showAdminPassword = signal(false);
    showAdminConfirm = signal(false);

    isRegistering = signal(false);
    errorMessage = signal('');
    private codeCheckTimer: any = null;
    private codeSuggestionCounter = 0;

    schoolTypeOptions = [
        { label: 'Select school type', value: '' },
        { label: 'K-12', value: 'k12' },
        { label: 'College', value: 'college' },
        { label: 'Training', value: 'training' },
        { label: 'Other', value: 'other' }
    ];

    cancelled = output<void>();
    registered = output<{ tenantId: string; subdomain: string }>();

    constructor(private tenantService: TenantService) {}

    onCancel(): void {
        this.cancelled.emit();
    }

    toggleAdminPassword(): void {
        this.showAdminPassword.update(value => !value);
    }

    toggleAdminConfirm(): void {
        this.showAdminConfirm.update(value => !value);
    }

    nextStep(): void {
        this.errorMessage.set('');
        const step = this.currentStep();
        if (step === 1) {
            if (!this.schoolName().trim()) return this.errorMessage.set('Please enter an organization name');
            if (!this.country().trim()) return this.errorMessage.set('Please enter a country or region');
            if (!this.timezone().trim()) return this.errorMessage.set('Please enter a time zone');
            if (!this.schoolCode().trim()) return this.errorMessage.set('Please enter a tenant URL');
            const codeRegex = /^[a-z0-9-]+$/;
            if (!codeRegex.test(this.schoolCode())) return this.errorMessage.set('Tenant URL should use lowercase letters, numbers, and hyphens');
            if (!this.email().trim()) return this.errorMessage.set('Please enter a contact email');
            if (this.codeStatus() === 'taken') return this.errorMessage.set('Tenant URL is already in use');
        }
        if (step === 2) {
            if (!this.adminName().trim()) return this.errorMessage.set('Please enter the admin name');
            if (!this.adminEmail().trim()) return this.errorMessage.set('Please enter the admin email');
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

    onSubmit(): void {
        if (!this.acceptTerms()) {
            this.errorMessage.set('Please accept the terms to continue');
            return;
        }

        this.isRegistering.set(true);
        this.errorMessage.set('');

        const tenantData = {
            name: this.schoolName(),
            subdomain: this.schoolCode(),
            contactEmail: this.email(),
            adminName: this.adminName(),
            adminEmail: this.adminEmail(),
            adminPassword: this.adminPassword().trim(),
            edition: 'trial' as TenantEdition,
            plan: 'trial' as TenantPlan,
            address: {
                country: this.country().trim()
            },
            timezone: this.timezone().trim(),
            metadata: {
                schoolType: this.schoolType()
            }
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
                    error.error?.message || 'Registration failed. This tenant URL may already be taken.'
                );
            }
        });
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
                    this.codeStatusMessage.set('Tenant URL is already taken');
                },
                error: (err: HttpErrorResponse) => {
                    if (err.status === 404) {
                        this.codeStatus.set('available');
                        this.codeStatusMessage.set('Tenant URL is available');
                    } else {
                        this.codeStatus.set('error');
                        this.codeStatusMessage.set('Could not verify tenant URL');
                    }
                }
            });
        }, 350);
    }

    meetsLength(): boolean { return this.adminPassword().trim().length >= 8; }
    meetsUpper(): boolean { return /[A-Z]/.test(this.adminPassword()); }
    meetsNumberOrSymbol(): boolean { return /[0-9]|[^A-Za-z0-9]/.test(this.adminPassword()); }

    private defaultTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch {
            return '';
        }
    }
}
