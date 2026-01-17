import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MbTableColumn } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { ApiClient } from '../../../../core/http/api-client.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { AddressValue } from '../../../../shared/components/address/address.component';
import { COUNTRY_OPTIONS } from '../../../../shared/components/country-select/country-select.component';
import { TIMEZONE_OPTIONS } from '../../../../shared/components/timezone-select/timezone-select.component';
import type { School } from '../../../../core/school/school.models';
import { SchoolRow } from './tenant-workspace-setup.models';

const DEFAULT_TIMEZONE = 'UTC';
const SCHOOL_TYPE = 'mixed';
const SCHOOL_CODE_REGEX = /^[a-z0-9-]+$/;
const SCHOOL_STATUS_MAP: Record<SchoolRow['status'], 'pending_setup' | 'active' | 'inactive' | 'archived'> = {
    Active: 'active',
    Inactive: 'inactive',
    Archived: 'archived',
};
const TIMEZONE_VALUES = TIMEZONE_OPTIONS.map(option => option.value);
const COUNTRY_LABELS = COUNTRY_OPTIONS.map(option => option.label.toLowerCase());

type SchoolCreatePayload = {
    name: string;
    code?: string;
    type: string;
    status: 'pending_setup' | 'active' | 'inactive' | 'archived';
    address?: AddressValue & { country?: string };
    settings?: { timezone?: string };
};

@Component({
    selector: 'app-tenant-schools',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './school-setup.component.html',
    styleUrls: ['./school-setup.component.scss']
})
export class TenantSchoolsComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly api = inject(ApiClient);
    private readonly toast = inject(ToastService);

    isLoading = signal(true);
    isSaving = signal(false);
    errorMessage = signal<string | null>(null);
    tenantAddress = signal<AddressValue | null>(null);
    country = signal('');
    defaultTimezone = signal(DEFAULT_TIMEZONE);

    schoolRows = signal<SchoolRow[]>([]);
    isSchoolModalOpen = signal(false);
    schoolFormName = signal('');
    schoolFormCode = signal('');
    schoolFormCountry = signal('');
    schoolFormTimezone = signal('');
    schoolFormTouched = signal(false);
    schoolFormCodeTouched = signal(false);
    schoolFormAddress = signal<AddressValue>({});
    schoolMenuOpenId = signal<string | null>(null);
    editingSchoolId = signal<string | null>(null);
    editingSchoolStatus = signal<SchoolRow['status']>('Active');

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

    ngOnInit(): void {
        this.loadInitialState();
        this.loadSchools();
    }

    openAddSchool(): void {
        this.editingSchoolId.set(null);
        this.editingSchoolStatus.set('Active');
        this.schoolFormName.set('');
        this.schoolFormCode.set('');
        this.schoolFormCountry.set(this.country());
        this.schoolFormTimezone.set(this.defaultTimezone());
        this.schoolFormAddress.set({});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
        this.errorMessage.set(null);
        this.isSchoolModalOpen.set(true);
    }

    closeSchoolModal(): void {
        this.isSchoolModalOpen.set(false);
        this.editingSchoolId.set(null);
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
    }

    copySchoolCode(row: SchoolRow): void {
        const code = row.code?.trim();
        if (!code) {
            this.toast.warning('No school code available.');
            return;
        }
        if (!navigator?.clipboard) {
            this.toast.error('Clipboard is unavailable in this browser.');
            return;
        }
        navigator.clipboard.writeText(code).then(() => {
            this.toast.info('School code copied.', 1500);
        }).catch(() => {
            this.toast.error('Unable to copy school code.');
        });
    }

    async saveSchool(): Promise<void> {
        if (!this.canSaveSchool()) {
            this.schoolFormTouched.set(true);
            return;
        }
        this.isSaving.set(true);
        this.errorMessage.set(null);
        const draft = this.buildSchoolRow();
        const editingId = this.editingSchoolId();
        try {
            if (editingId) {
                const saved = await firstValueFrom(
                    this.api.patch<School>(`schools/${editingId}`, this.buildSchoolPayload(draft))
                );
                const savedRow = this.toSchoolRow(saved, draft);
                this.schoolRows.update(rows => rows.map(row => row.id === editingId ? savedRow : row));
                this.toast.success('School updated.');
            } else {
                const saved = await firstValueFrom(
                    this.api.post<School>('schools', this.buildSchoolPayload(draft))
                );
                const savedRow = this.toSchoolRow(saved, draft);
                this.schoolRows.update(rows => [...rows, savedRow]);
                this.toast.success('School added.');
            }
            this.closeSchoolModal();
        } catch (error) {
            this.errorMessage.set('Unable to save school. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    openEditSchool(row: SchoolRow): void {
        if (!row) return;
        this.editingSchoolId.set(row.id ?? null);
        this.editingSchoolStatus.set(row.status);
        this.schoolFormName.set(row.name);
        this.schoolFormCode.set(row.code);
        this.schoolFormCountry.set(row.country);
        this.schoolFormTimezone.set(row.timezone);
        this.schoolFormAddress.set(row.address || {});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(true);
        this.errorMessage.set(null);
        this.isSchoolModalOpen.set(true);
    }

    cloneSchool(row: SchoolRow): void {
        if (!row) return;
        const name = `${row.name} Copy`;
        const code = row.code ? `${row.code}-copy` : this.generateSchoolCode(name);
        this.editingSchoolId.set(null);
        this.editingSchoolStatus.set('Active');
        this.schoolFormName.set(name);
        this.schoolFormCode.set(code);
        this.schoolFormCountry.set(row.country);
        this.schoolFormTimezone.set(row.timezone);
        this.schoolFormAddress.set(row.address || {});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(true);
        this.errorMessage.set(null);
        this.isSchoolModalOpen.set(true);
    }

    async archiveSchool(row: SchoolRow): Promise<void> {
        if (!row?.id) return;
        this.isSaving.set(true);
        try {
            const saved = await firstValueFrom(
                this.api.patch<School>(`schools/${row.id}`, { status: 'archived' })
            );
            const savedRow = this.toSchoolRow(saved, { ...row, status: 'Archived' });
            this.schoolRows.update(rows => rows.map(item => item.id === row.id ? savedRow : item));
            this.toast.success(`"${row.name}" archived.`);
        } catch {
            this.toast.error('Unable to archive school. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    async deleteSchool(row: SchoolRow): Promise<void> {
        if (!row?.id) return;
        this.isSaving.set(true);
        try {
            await firstValueFrom(this.api.delete<void>(`schools/${row.id}`));
            this.schoolRows.update(rows => rows.filter(item => item.id !== row.id));
            this.toast.success(`"${row.name}" deleted.`);
        } catch {
            this.toast.error('Unable to delete school. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    toggleSchoolMenu(row: SchoolRow, event?: MouseEvent): void {
        event?.stopPropagation();
        const key = this.schoolMenuKey(row);
        const next = this.schoolMenuOpenId() === key ? null : key;
        this.schoolMenuOpenId.set(next);
    }

    closeSchoolMenu(): void {
        this.schoolMenuOpenId.set(null);
    }

    schoolMenuKey(row: SchoolRow): string {
        return row.id ?? row.code ?? row.name;
    }

    onSchoolFormNameChange(value: string): void {
        this.schoolFormName.set(value);
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

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.tenantSettings.getSettings().subscribe({
            next: (tenant: any) => {
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

                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    private loadSchools(): void {
        this.isLoading.set(true);
        this.api.get<School[]>('schools').subscribe({
            next: (schools) => {
                this.schoolRows.set(schools.map((school) => this.toSchoolRow(school)));
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
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

    private buildSchoolRow(): SchoolRow {
        return {
            name: this.schoolFormName().trim(),
            code: this.schoolFormCode().trim(),
            country: this.schoolFormCountry().trim(),
            timezone: this.schoolFormTimezone().trim(),
            status: this.editingSchoolStatus(),
            address: this.schoolFormAddress(),
        };
    }

    private buildSchoolPayload(row: SchoolRow): SchoolCreatePayload {
        return {
            name: row.name.trim(),
            code: row.code.trim() || undefined,
            type: SCHOOL_TYPE,
            status: SCHOOL_STATUS_MAP[row.status] ?? 'pending_setup',
            address: {
                ...(row.address || {}),
                country: row.country || undefined,
            }
            ,
            settings: row.timezone ? { timezone: row.timezone } : undefined,
        };
    }

    private toSchoolRow(school: School, fallback?: SchoolRow): SchoolRow {
        const status = school.status === 'archived'
            ? 'Archived'
            : school.status === 'inactive'
                ? 'Inactive'
                : 'Active';
        const address = school.address ?? fallback?.address ?? {};
        const country = school.address?.country ?? fallback?.country ?? '';
        const timezone = (school.settings as { timezone?: string } | undefined)?.timezone
            ?? fallback?.timezone
            ?? this.defaultTimezone();
        return {
            id: school.id,
            name: school.name,
            code: school.code ?? fallback?.code ?? '',
            country,
            timezone,
            status,
            address,
        };
    }
}
