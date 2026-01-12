import { Component, EnvironmentInjector, OnInit, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbSelectComponent,
    MbTableActionsDirective,
    MbTableComponent,
    MbTableColumn,
} from '@mindbloom/ui';
import { AddressComponent, AddressValue } from '../../../../shared/components/address/address.component';
import { COUNTRY_OPTIONS, CountrySelectComponent } from '../../../../shared/components/country-select/country-select.component';
import { TIMEZONE_OPTIONS, TimezoneSelectComponent } from '../../../../shared/components/timezone-select/timezone-select.component';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { FirstLoginSetupService, FirstLoginSetupState } from '../../../../core/services/first-login-setup.service';

interface SchoolRow {
    name: string;
    code: string;
    country: string;
    timezone: string;
    status: 'Active' | 'Inactive';
    address?: AddressValue;
}

interface InviteRow {
    email: string;
    role: 'Administrator' | 'Teacher' | 'Staff';
}

interface FirstLoginSetupData {
    schoolRows?: SchoolRow[];
    departments?: string[];
    levelsTemplate?: 'k12' | 'primary_secondary' | 'custom';
    levels?: string[];
    classes?: Array<{ name: string; level: string; sections: string }>;
    gradingModel?: 'letter' | 'numeric' | 'gpa' | 'custom';
    invites?: InviteRow[];
}

@Component({
    selector: 'app-tenant-workspace-setup',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MbCardComponent,
        MbButtonComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbSelectComponent,
        MbAlertComponent,
        MbTableComponent,
        MbTableActionsDirective,
        AddressComponent,
        CountrySelectComponent,
        TimezoneSelectComponent,
    ],
    templateUrl: './tenant-workspace-setup.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly tenantService = inject(TenantService);
    private readonly schoolService = inject(SchoolService);
    private readonly setupStore = inject(FirstLoginSetupService);
    private readonly router = inject(Router);
    private readonly injector = inject(EnvironmentInjector);

    private autosaveInitialized = false;

    step = signal<number>(0);
    isLoading = signal(true);
    isSaving = signal(false);
    attemptedContinue = signal(false);
    errorMessage = signal('');

    tenantId = signal<string>('');
    tenantName = signal<string>('');
    country = signal<string>('');
    defaultTimezone = signal<string>('');
    tenantAddress = signal<AddressValue | null>(null);

    schoolRows = signal<SchoolRow[]>([]);
    isSchoolModalOpen = signal(false);
    editingSchoolIndex = signal<number | null>(null);
    schoolFormName = signal('');
    schoolFormCode = signal('');
    schoolFormCountry = signal('');
    schoolFormTimezone = signal('');
    schoolFormTouched = signal(false);
    schoolFormCodeTouched = signal(false);
    schoolFormAddress = signal<AddressValue>({});

    departments = signal<string[]>(['Academics', 'Administration', 'Finance']);
    levelsTemplate = signal<'k12' | 'primary_secondary' | 'custom'>('k12');
    levels = signal<string[]>(this.defaultLevels('k12'));
    classes = signal<Array<{ name: string; level: string; sections: string }>>([
        { name: '', level: '', sections: '' }
    ]);

    gradingModel = signal<'letter' | 'numeric' | 'gpa' | 'custom'>('letter');
    gradingScale = computed(() => this.buildGradingScale(this.gradingModel()));

    invites = signal<InviteRow[]>([{ email: '', role: 'Teacher' }]);

    readonly schoolTableColumns: MbTableColumn<SchoolRow>[] = [
        {
            key: 'name',
            label: 'School name',
            cell: row => row.name
        },
        {
            key: 'code',
            label: 'Code',
            cell: row => row.code
        },
        {
            key: 'location',
            label: 'Location',
            cell: row => this.formatSchoolLocation(row)
        },
        {
            key: 'timezone',
            label: 'Time zone',
            cell: row => row.timezone
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    readonly stepLabels = [
        'Organization & schools',
        'Academic structure',
        'Staff and users',
        'Grading system',
        'Time zones & calendars',
        'Classes & sections',
        'Roles & permissions',
        'Review & activate'
    ];

    readonly progressIndex = computed(() => {
        if (this.step() <= 0) return -1;
        return Math.min(this.step() - 1, this.stepLabels.length - 1);
    });

    readonly progressPercent = computed(() => {
        if (this.progressIndex() < 0) return 0;
        return ((this.progressIndex() + 1) / this.stepLabels.length) * 100;
    });

    readonly isReviewStep = computed(() => this.step() === 8);
    readonly isDoneStep = computed(() => this.step() === 9);
    readonly showErrors = computed(() => this.attemptedContinue());
    readonly inviteCount = computed(() => this.invites().filter(row => row.email.trim()).length);

    readonly levelsError = computed(() => {
        if (!this.showErrors() || this.step() !== 4) return '';
        return this.levels().some(level => level.trim()) ? '' : 'Add at least one level.';
    });

    inviteEmailError(row: InviteRow): string {
        if (!this.showErrors()) return '';
        const email = row.email.trim();
        if (!email) return '';
        return this.isValidEmail(email) ? '' : 'Enter a valid email.';
    }

    readonly schoolsValid = computed(() => {
        const rows = this.schoolRows().filter(row => row.status === 'Active');
        if (!rows.length) return false;
        return rows.every(row => !!row.name.trim() && !!row.code.trim() && !!row.country.trim() && !!row.timezone.trim());
    });

    readonly canSaveSchool = computed(() => {
        const code = this.schoolFormCode().trim();
        return !!this.schoolFormName().trim()
            && !!code
            && /^[a-z0-9-]+$/.test(code)
            && !!this.schoolFormCountry().trim()
            && this.isValidCountry(this.schoolFormCountry())
            && !!this.schoolFormTimezone().trim()
            && this.isValidTimezone(this.schoolFormTimezone());
    });

    readonly canContinue = computed(() => {
        switch (this.step()) {
            case 1:
                return this.schoolsValid();
            case 2:
                return this.schoolsValid();
            case 4:
                return this.levels().length > 0;
            case 5:
                return this.classes().every(row => !!row.name.trim() && !!row.level.trim());
            case 7:
                return this.invites().every(row => !row.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim()));
            default:
                return true;
        }
    });

    readonly timezones = computed(() => TIMEZONE_OPTIONS.map(option => option.value));

    readonly countryOptions = computed(() => COUNTRY_OPTIONS);


    ngOnInit(): void {
        this.loadInitialState();
        this.initAutosave();
    }

    startSetup(): void {
        this.step.set(1);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    skipSetup(): void {
        this.persistState('skipped');
        this.router.navigateByUrl('/dashboard');
    }

    back(): void {
        if (this.step() <= 0) return;
        this.step.set(this.step() - 1);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    next(): void {
        if (!this.canContinue()) {
            this.attemptedContinue.set(true);
            return;
        }
        if (this.step() < 8) {
            this.step.set(this.step() + 1);
            this.attemptedContinue.set(false);
            this.persistState('in_progress');
            return;
        }
        this.completeSetup();
    }

    goToStep(index: number): void {
        const target = Math.min(Math.max(index, 1), 8);
        this.step.set(target);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    continueFromPanel(): void {
        const current = Math.max(this.step(), 1);
        const target = Math.min(current, 8);
        this.step.set(target);
        this.attemptedContinue.set(false);
        this.scrollToCurrent();
    }

    private scrollToCurrent(): void {
        try {
            const el = document.getElementById('setup-step-content');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch {
            // No-op
        }
    }

    addSchoolRow(): void {
        const name = '';
        this.schoolRows.update(rows => [...rows, this.defaultSchoolRow(name)]);
    }

    removeSchoolRow(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, i) => i !== index));
    }

    updateSchoolRow(index: number, field: keyof SchoolRow, value: string): void {
        this.schoolRows.update(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
    }

    updateSchoolAddressField(index: number, field: keyof AddressValue, value: string): void {
        this.schoolRows.update(rows => rows.map((row, i) => {
            if (i !== index) return row;
            return {
                ...row,
                address: { ...(row.address || {}), [field]: value }
            };
        }));
    }

    updateSchoolAddress(index: number, value: AddressValue): void {
        this.schoolRows.update(rows => rows.map((row, i) => i === index ? { ...row, address: value } : row));
    }

    openAddSchool(): void {
        this.editingSchoolIndex.set(null);
        this.schoolFormName.set('');
        this.schoolFormCode.set('');
        this.schoolFormCountry.set(this.country());
        this.schoolFormTimezone.set(this.defaultTimezone());
        this.schoolFormAddress.set({});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
        this.isSchoolModalOpen.set(true);
    }

    openEditSchool(index: number): void {
        const row = this.schoolRows()[index];
        if (!row) return;
        this.editingSchoolIndex.set(index);
        this.schoolFormName.set(row.name);
        this.schoolFormCode.set(row.code);
        this.schoolFormCountry.set(row.country);
        this.schoolFormTimezone.set(row.timezone);
        this.schoolFormAddress.set(row.address || {});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(true);
        this.isSchoolModalOpen.set(true);
    }

    closeSchoolModal(): void {
        this.isSchoolModalOpen.set(false);
        this.editingSchoolIndex.set(null);
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
    }

    saveSchool(): void {
        if (!this.canSaveSchool()) {
            this.schoolFormTouched.set(true);
            return;
        }
        const nextRow: SchoolRow = {
            name: this.schoolFormName().trim(),
            code: this.schoolFormCode().trim(),
            country: this.schoolFormCountry().trim(),
            timezone: this.schoolFormTimezone().trim(),
            status: 'Active',
            address: this.schoolFormAddress(),
        };
        const editIndex = this.editingSchoolIndex();
        if (editIndex === null) {
            this.schoolRows.update(rows => [...rows, nextRow]);
        } else {
            this.schoolRows.update(rows => rows.map((row, i) => i === editIndex ? { ...row, ...nextRow } : row));
        }
        this.isSchoolModalOpen.set(false);
        this.editingSchoolIndex.set(null);
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
    }

    toggleSchoolStatus(index: number): void {
        this.schoolRows.update(rows => rows.map((row, i) => {
            if (i !== index) return row;
            const status = row.status === 'Active' ? 'Inactive' : 'Active';
            return { ...row, status };
        }));
    }

    deleteSchool(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, i) => i !== index));
    }

    formatSchoolLocation(row: SchoolRow): string {
        if (row.address?.city) {
            return `${row.address.city}, ${row.country || '—'}`;
        }
        return row.country || '—';
    }

    getSchoolRowIndex(row: SchoolRow): number {
        return this.schoolRows().indexOf(row);
    }

    onSchoolFormNameChange(value: string): void {
        this.schoolFormName.set(value);
        if (this.editingSchoolIndex() !== null) return;
        if (this.schoolFormCodeTouched()) return;
        this.schoolFormCode.set(this.generateSchoolCode(value));
    }

    onSchoolFormCodeChange(value: string): void {
        this.schoolFormCodeTouched.set(true);
        const normalized = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        this.schoolFormCode.set(normalized);
    }

    copySchoolAddressFromTenant(): void {
        const tenantAddress = this.tenantAddress();
        if (!tenantAddress) return;
        this.schoolFormAddress.set({ ...tenantAddress });
        if (!this.schoolFormCountry().trim() && this.country().trim()) {
            this.schoolFormCountry.set(this.country());
        }
    }

    markSchoolFormTouched(): void {
        this.schoolFormTouched.set(true);
    }

    onSchoolFormCountryChange(value: string): void {
        this.schoolFormCountry.set(value);
        if (!this.schoolFormTimezone().trim()) {
            this.schoolFormTimezone.set(this.defaultTimezone());
        }
    }

    addDepartment(): void {
        this.departments.update(items => [...items, '']);
    }

    updateDepartment(index: number, value: string): void {
        this.departments.update(items => items.map((item, i) => i === index ? value : item));
    }

    removeDepartment(index: number): void {
        this.departments.update(items => items.filter((_, i) => i !== index));
    }

    setLevelsTemplate(template: 'k12' | 'primary_secondary' | 'custom'): void {
        this.levelsTemplate.set(template);
        this.levels.set(this.defaultLevels(template));
    }

    addLevel(): void {
        this.levels.update(items => [...items, '']);
    }

    updateLevel(index: number, value: string): void {
        this.levels.update(items => items.map((item, i) => i === index ? value : item));
    }

    removeLevel(index: number): void {
        this.levels.update(items => items.filter((_, i) => i !== index));
    }

    addClassRow(): void {
        this.classes.update(items => [...items, { name: '', level: '', sections: '' }]);
    }

    updateClassRow(index: number, field: 'name' | 'level' | 'sections', value: string): void {
        this.classes.update(items => items.map((row, i) => i === index ? { ...row, [field]: value } : row));
    }

    removeClassRow(index: number): void {
        this.classes.update(items => items.filter((_, i) => i !== index));
    }

    addInviteRow(): void {
        this.invites.update(items => [...items, { email: '', role: 'Teacher' }]);
    }

    updateInviteRow(index: number, field: 'email' | 'role', value: string): void {
        this.invites.update(items => items.map((row, i) => i === index ? { ...row, [field]: value as any } : row));
    }

    removeInviteRow(index: number): void {
        this.invites.update(items => items.filter((_, i) => i !== index));
    }

    finish(): void {
        this.router.navigateByUrl('/dashboard');
    }

    private async completeSetup(): Promise<void> {
        this.isSaving.set(true);
        try {
            const schools = this.schoolRows()
                .filter(row => row.status === 'Active')
                .map(row => ({
                    name: row.name.trim(),
                    code: row.code.trim() || undefined
                }));

            for (const school of schools) {
                if (!school.name) continue;
                await firstValueFrom(this.schoolService.createSchool(school));
            }

            this.persistState('completed');
            this.step.set(9);
        } catch {
            this.errorMessage.set('Unable to complete setup. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.tenantSettings.getSettings().subscribe({
            next: (tenant: any) => {
                const tenantId = tenant.id || this.tenantService.getTenantId() || '';
                this.tenantId.set(tenantId);
                this.tenantName.set(tenant.name || '');
                const tenantAddress = tenant.contactInfo?.address || {};
                this.country.set(tenantAddress.country || '');
                const hasTenantAddress = !!(
                    tenantAddress.street ||
                    tenantAddress.city ||
                    tenantAddress.state ||
                    tenantAddress.postalCode
                );
                this.tenantAddress.set(hasTenantAddress ? {
                    street: tenantAddress.street || '',
                    city: tenantAddress.city || '',
                    state: tenantAddress.state || '',
                    postalCode: tenantAddress.postalCode || '',
                } : null);
                this.defaultTimezone.set(tenant.timezone || this.defaultTimeZone());
                if (!this.schoolRows().length) {
                    const defaultName = tenant.name || 'School';
                    this.schoolRows.set([this.defaultSchoolRow(defaultName)]);
                }

                const serverState = tenant.extras?.setupProgram as FirstLoginSetupState | undefined;
                const localState = tenantId ? this.setupStore.load(tenantId) : null;
                const state = serverState || localState;

                if (state && state.status === 'in_progress') {
                    this.applyState(state);
                    this.step.set(state.step || 1);
                }

                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Unable to load setup details. Please refresh and try again.');
                this.isLoading.set(false);
            }
        });
    }

    private initAutosave(): void {
        if (this.autosaveInitialized) return;
        this.autosaveInitialized = true;

        runInInjectionContext(this.injector, () => {
            effect(() => {
                this.step();
                this.schoolRows();
                this.departments();
                this.levels();
                this.levelsTemplate();
                this.classes();
                this.gradingModel();
                this.invites();

                if (!this.isLoading()) {
                    this.persistState('in_progress');
                }
            });
        });
    }

    private applyState(state: FirstLoginSetupState): void {
        if (!state.data) return;
        const data = state.data as FirstLoginSetupData;
        this.step.set(state.step || 1);
        if (data.schoolRows?.length) {
            this.schoolRows.set(data.schoolRows.map(row => this.normalizeSchoolRow(row)));
        }
        this.departments.set(data.departments?.length ? data.departments : this.departments());
        this.levelsTemplate.set(data.levelsTemplate || 'k12');
        this.levels.set(data.levels?.length ? data.levels : this.defaultLevels(this.levelsTemplate()));
        this.classes.set(data.classes?.length ? data.classes : this.classes());
        this.gradingModel.set(data.gradingModel || 'letter');
        this.invites.set(data.invites?.length ? data.invites : this.invites());
    }

    private persistState(status: 'in_progress' | 'skipped' | 'completed'): void {
        const tenantId = this.tenantId();
        if (!tenantId) return;

        const payload: FirstLoginSetupState = {
            status,
            step: this.step(),
            startedAt: status === 'in_progress' ? new Date().toISOString() : undefined,
            skippedAt: status === 'skipped' ? new Date().toISOString() : undefined,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            data: {
                schoolRows: this.schoolRows(),
                departments: this.departments(),
                levelsTemplate: this.levelsTemplate(),
                levels: this.levels(),
                classes: this.classes(),
                gradingModel: this.gradingModel(),
                invites: this.invites(),
            }
        };

        this.setupStore.save(tenantId, payload);
        this.tenantSettings.updateSettings({
            extras: {
                setupProgram: payload
            }
        }).subscribe();
    }

    private defaultSchoolRow(name: string): SchoolRow {
        const code = this.generateSchoolCode(name);
        return {
            name,
            code,
            country: this.country(),
            timezone: this.defaultTimezone(),
            status: 'Active'
            ,
            address: {},
        };
    }

    private normalizeSchoolRow(row: Partial<SchoolRow>): SchoolRow {
        return {
            name: row.name?.trim() || '',
            code: row.code?.trim() || '',
            country: row.country?.trim() || this.country(),
            timezone: row.timezone?.trim() || this.defaultTimezone(),
            status: row.status || 'Active'
            ,
            address: row.address || {},
        };
    }

    private generateSchoolCode(name: string): string {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed) return '';
        return trimmed
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 32);
    }

    isValidCountry(value: string): boolean {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed) return false;
        return this.countryOptions().some(option => option.label.toLowerCase() === trimmed);
    }

    isValidTimezone(value: string): boolean {
        const trimmed = value.trim();
        if (!trimmed) return false;
        return this.timezones().includes(trimmed);
    }

    schoolFormCodeError(): string {
        if (!this.schoolFormTouched()) return '';
        const code = this.schoolFormCode().trim();
        if (!code) return 'School code is required.';
        if (!/^[a-z0-9-]+$/.test(code)) {
            return 'Use lowercase letters, numbers, and hyphens.';
        }
        return '';
    }

    schoolFormCountryError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormCountry().trim();
        if (!value) return 'Select a country or region.';
        if (!this.isValidCountry(value)) return 'Select a valid country or region.';
        return '';
    }

    schoolFormTimezoneError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormTimezone().trim();
        if (!value) return 'Select a time zone.';
        if (!this.isValidTimezone(value)) return 'Select a valid time zone.';
        return '';
    }

    private defaultLevels(template: 'k12' | 'primary_secondary' | 'custom'): string[] {
        if (template === 'primary_secondary') {
            return ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4'];
        }
        if (template === 'custom') {
            return [''];
        }
        return ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }

    private buildGradingScale(model: 'letter' | 'numeric' | 'gpa' | 'custom'): Array<{ label: string; value: string }>{
        if (model === 'numeric') {
            return [
                { label: '90–100', value: 'A' },
                { label: '80–89', value: 'B' },
                { label: '70–79', value: 'C' },
                { label: '60–69', value: 'D' },
                { label: 'Below 60', value: 'F' }
            ];
        }
        if (model === 'gpa') {
            return [
                { label: '4.0', value: 'Excellent' },
                { label: '3.0', value: 'Good' },
                { label: '2.0', value: 'Satisfactory' },
                { label: '1.0', value: 'Needs improvement' }
            ];
        }
        if (model === 'custom') {
            return [
                { label: 'Define your scale in Settings', value: 'Custom' }
            ];
        }
        return [
            { label: 'A', value: 'Excellent' },
            { label: 'B', value: 'Good' },
            { label: 'C', value: 'Satisfactory' },
            { label: 'D', value: 'Needs improvement' },
            { label: 'F', value: 'Unsatisfactory' }
        ];
    }

    private fallbackTimezones(): string[] {
        return [
            'UTC',
            'Africa/Accra',
            'Africa/Johannesburg',
            'America/Chicago',
            'America/Los_Angeles',
            'America/New_York',
            'Asia/Dubai',
            'Asia/Kolkata',
            'Asia/Singapore',
            'Europe/London',
            'Europe/Paris'
        ];
    }

    private defaultTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
            return 'UTC';
        }
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
