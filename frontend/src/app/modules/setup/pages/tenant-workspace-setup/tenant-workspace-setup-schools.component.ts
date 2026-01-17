import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MbTableColumn } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiClient } from '../../../../core/http/api-client.service';
import { AddressValue } from '../../../../shared/components/address/address.component';
import { COUNTRY_OPTIONS } from '../../../../shared/components/country-select/country-select.component';
import { TIMEZONE_OPTIONS } from '../../../../shared/components/timezone-select/timezone-select.component';
import type { FirstLoginSetupState } from '../../../../core/types/first-login-setup-state';
import type { School } from '../../../../core/school/school.models';
import { SchoolRow } from './tenant-workspace-setup.models';

const SETUP_ROUTE = '/setup/workspace';
const STEP_ENTRY = 0;
const STEP_SCHOOLS = 1;
const STEP_USERS = 2;
const DEFAULT_TIMEZONE = 'UTC';
const SCHOOL_TYPE = 'mixed';
const SCHOOL_CODE_REGEX = /^[a-z0-9-]+$/;
const SCHOOL_STATUS_MAP: Record<SchoolRow['status'], 'pending_setup' | 'active' | 'inactive' | 'archived'> = {
    Active: 'active',
    Inactive: 'inactive',
};
const TIMEZONE_VALUES = TIMEZONE_OPTIONS.map(option => option.value);
const COUNTRY_LABELS = COUNTRY_OPTIONS.map(option => option.label.toLowerCase());

@Component({
    selector: 'app-tenant-workspace-setup-schools',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-schools.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupSchoolsComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly authService = inject(AuthService);
    private readonly api = inject(ApiClient);
    private readonly router = inject(Router);

    private tenantExtras: Record<string, any> = {};

    isLoading = signal(true);
    tenantAddress = signal<AddressValue | null>(null);
    country = signal('');
    defaultTimezone = signal(DEFAULT_TIMEZONE);

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
    schoolMenuOpenIndex = signal<number | null>(null);

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

    readonly schoolsValid = computed(() => {
        const rows = this.schoolRows().filter(row => row.status === 'Active');
        if (!rows.length) return false;
        return rows.every(row =>
            !!row.name.trim()
            && !!row.code.trim()
            && !!row.country.trim()
            && !!row.timezone.trim()
        );
    });

    readonly canSaveSchool = computed(() => {
        const code = this.schoolFormCode().trim();
        return !!this.schoolFormName().trim()
            && !!code
            && SCHOOL_CODE_REGEX.test(code)
            && !!this.schoolFormCountry().trim()
            && this.isValidCountry(this.schoolFormCountry())
            && !!this.schoolFormTimezone().trim()
            && this.isValidTimezone(this.schoolFormTimezone());
    });

    readonly canContinue = computed(() => this.schoolsValid());

    ngOnInit(): void {
        this.loadInitialState();
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

    async saveSchool(): Promise<void> {
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
            try {
                const saved = await firstValueFrom(this.api.post<School>('schools', this.buildSchoolPayload(nextRow)));
                const savedId = (saved as any).id || (saved as any)._id;
                nextRow.id = savedId || nextRow.id;
            } catch {
                // Allow local save even if backend fails.
            }
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

    getSchoolRowIndex(row: SchoolRow): number {
        return this.schoolRows().indexOf(row);
    }

    handleSchoolCellClick(event: { row: SchoolRow; column: MbTableColumn<SchoolRow> }): void {
        if (String(event.column.key) !== 'name') return;
        const index = this.getSchoolRowIndex(event.row);
        if (index < 0) return;
        this.openEditSchool(index);
    }

    toggleSchoolMenu(index: number, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.schoolMenuOpenIndex() === index ? null : index;
        this.schoolMenuOpenIndex.set(next);
    }

    closeSchoolMenu(): void {
        this.schoolMenuOpenIndex.set(null);
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

    onSchoolFormCountryChange(value: string): void {
        this.schoolFormCountry.set(value);
        if (!this.schoolFormTimezone().trim()) {
            this.schoolFormTimezone.set(this.defaultTimezone());
        }
    }

    onSchoolFormAddressChange(value: AddressValue): void {
        this.schoolFormAddress.set(value);
    }

    onSchoolFormTimezoneChange(value: string): void {
        this.schoolFormTimezone.set(value);
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

    schoolFormCodeError(): string {
        if (!this.schoolFormTouched()) return '';
        const code = this.schoolFormCode().trim();
        if (!code) return 'School code is required.';
        if (!SCHOOL_CODE_REGEX.test(code)) return 'Use lowercase letters, numbers, and hyphens only.';
        return '';
    }

    schoolFormCountryError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormCountry().trim();
        if (!value) return 'Country is required.';
        if (!this.isValidCountry(value)) return 'Select a valid country.';
        return '';
    }

    schoolFormTimezoneError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormTimezone().trim();
        if (!value) return 'Time zone is required.';
        if (!this.isValidTimezone(value)) return 'Select a valid time zone.';
        return '';
    }

    async next(): Promise<void> {
        if (!this.canContinue()) {
            this.schoolFormTouched.set(true);
            return;
        }
        await this.saveSchoolsToApi();
        this.router.navigate([SETUP_ROUTE], { queryParams: { step: STEP_USERS } });
    }

    back(): void {
        this.router.navigate([SETUP_ROUTE], { queryParams: { step: STEP_ENTRY } });
    }

    skipSetup(): void {
        const existing = this.tenantExtras['setupProgram'] as FirstLoginSetupState | undefined;
        const data = { ...(existing?.data || {}), schoolRows: this.schoolRows() };
        const payload: FirstLoginSetupState = {
            status: 'skipped',
            step: STEP_SCHOOLS,
            startedAt: existing?.startedAt,
            skippedAt: new Date().toISOString(),
            completedAt: existing?.completedAt,
            data
        };

        const extras: Record<string, any> = {
            ...this.tenantExtras,
            setupProgram: payload
        };

        const userId = this.authService.session()?.user?.id;
        if (userId) {
            const dismissed = { ...(extras['userSetupDismissed'] || {}) };
            dismissed[userId] = true;
            extras['userSetupDismissed'] = dismissed;
        }

        this.tenantSettings.updateSettings({ extras }).subscribe({
            next: () => {
                this.tenantExtras = extras;
            }
        });
        this.router.navigateByUrl('/dashboard');
    }

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.tenantSettings.getSettings().subscribe({
            next: (tenant: any) => {
                this.tenantExtras = { ...(tenant.extras || {}) };
                const tenantAddress = tenant.contactInfo?.address || {};
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
                this.country.set(tenantAddress.country || '');
                this.defaultTimezone.set(tenant.timezone || this.defaultTimeZone());

                const state = tenant.extras?.setupProgram as FirstLoginSetupState | undefined;
                if (state?.data?.['schoolRows']?.length) {
                    this.schoolRows.set(state.data['schoolRows'].map((row: any) => this.normalizeSchoolRow(row)));
                } else {
                    const defaultName = tenant.name || 'School';
                    this.schoolRows.set([this.defaultSchoolRow(defaultName)]);
                }

                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    private async saveSchoolsToApi(): Promise<void> {
        const rows = this.schoolRows();
        if (!rows.length) return;
        const nextRows = [...rows];
        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            if (row.status !== 'Active') continue;
            if (row.id) continue;
            const name = row.name.trim();
            if (!name) continue;
            const saved = await firstValueFrom(this.api.post<School>('schools', this.buildSchoolPayload(row)));
            const savedId = (saved as any).id || (saved as any)._id;
            nextRows[index] = {
                ...row,
                id: savedId || row.id
            };
        }
        this.schoolRows.set(nextRows);
    }

    private defaultSchoolRow(name: string): SchoolRow {
        const code = this.generateSchoolCode(name);
        return {
            name,
            code,
            country: this.country(),
            timezone: this.defaultTimezone(),
            status: 'Active',
            address: {},
        };
    }

    private normalizeSchoolRow(row: Partial<SchoolRow>): SchoolRow {
        return {
            name: row.name?.trim() || '',
            code: row.code?.trim() || '',
            country: row.country?.trim() || this.country(),
            timezone: row.timezone?.trim() || this.defaultTimezone(),
            status: row.status || 'Active',
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

    private formatSchoolLocation(row: SchoolRow): string {
        if (row.address?.city) {
            return `${row.address.city}, ${row.country || '—'}`;
        }
        return row.country || '—';
    }

    private isValidCountry(value: string): boolean {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed) return false;
        return COUNTRY_LABELS.includes(trimmed);
    }

    private isValidTimezone(value: string): boolean {
        const trimmed = value.trim();
        if (!trimmed) return false;
        return TIMEZONE_VALUES.includes(trimmed);
    }

    private defaultTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
        } catch {
            return DEFAULT_TIMEZONE;
        }
    }

    private buildSchoolPayload(row: SchoolRow): {
        name: string;
        code?: string;
        type: string;
        status: 'pending_setup' | 'active' | 'inactive' | 'archived';
        address?: AddressValue & { country?: string };
    } {
        return {
            name: row.name.trim(),
            code: row.code.trim() || undefined,
            type: SCHOOL_TYPE,
            status: SCHOOL_STATUS_MAP[row.status] ?? 'pending_setup',
            address: {
                ...(row.address || {}),
                country: row.country || undefined,
            }
        };
    }
}
