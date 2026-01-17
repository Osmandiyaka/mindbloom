import { Component, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MbSelectOption, MbTableColumn, MbTableComponent } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ApiClient } from '../../../../core/http/api-client.service';
import type { School } from '../../../../core/school/school.models';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZES = [10, 25, 50];

const STATUS_LABELS: Record<SchoolStatus, string> = {
    active: 'Active',
    archived: 'Archived',
};

const CODE_MIN_LENGTH = 3;
const CODE_MAX_LENGTH = 50;

type SchoolStatus = 'active' | 'archived';
type StatusFilter = 'all' | SchoolStatus;
type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';
type DensityOption = 'comfortable' | 'compact';

type WorkspaceSchool = {
    id: string;
    name: string;
    code: string;
    locationCountry: string;
    timeZone: string;
    status: SchoolStatus;
    createdAt: Date;
    updatedAt?: Date;
    shortName?: string;
    city?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    postalCode?: string;
};

type SchoolFormSnapshot = {
    name: string;
    code: string;
    country: string;
    timezone: string;
    status: SchoolStatus;
    shortName: string;
    city: string;
    contactEmail: string;
    contactPhone: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    postalCode: string;
};

@Component({
    selector: 'app-tenant-schools',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './school-setup.component.html',
    styleUrls: ['./school-setup.component.scss']
})
export class TenantSchoolsComponent implements OnInit {
    private readonly toast = inject(ToastService);
    private readonly api = inject(ApiClient);

    @ViewChild(MbTableComponent) table?: MbTableComponent<WorkspaceSchool>;

    schools = signal<WorkspaceSchool[]>([]);
    searchQuery = signal('');
    statusFilter = signal<StatusFilter>('all');
    sortBy = signal<SortOption>('name-asc');
    density = signal<DensityOption>('comfortable');
    pageSize = signal(DEFAULT_PAGE_SIZE);
    pageIndex = signal(1);
    selectedSchoolIds = signal(new Set<string>());

    headerMenuOpen = signal(false);
    bulkMenuOpen = signal(false);
    rowMenuOpenId = signal<string | null>(null);
    rowDangerMenuOpenId = signal<string | null>(null);

    drawerSchoolId = signal<string | null>(null);

    isSchoolModalOpen = signal(false);
    editingSchoolId = signal<string | null>(null);
    schoolFormName = signal('');
    schoolFormCode = signal('');
    schoolFormCountry = signal('');
    schoolFormTimezone = signal('');
    schoolFormStatus = signal<SchoolStatus>('active');
    schoolFormShortName = signal('');
    schoolFormCity = signal('');
    schoolFormContactEmail = signal('');
    schoolFormContactPhone = signal('');
    schoolFormAddressLine1 = signal('');
    schoolFormAddressLine2 = signal('');
    schoolFormState = signal('');
    schoolFormPostalCode = signal('');
    schoolFormAdvancedOpen = signal(false);

    schoolFormSubmitAttempted = signal(false);
    schoolFormNameTouched = signal(false);
    schoolFormCodeTouched = signal(false);
    schoolFormCountryTouched = signal(false);
    schoolFormTimezoneTouched = signal(false);
    schoolFormCodeEdited = signal(false);
    schoolFormSnapshot = signal<SchoolFormSnapshot | null>(null);
    discardConfirmOpen = signal(false);

    lastUsedCountry = signal('');
    lastUsedTimezone = signal('');
    isSaving = signal(false);

    archiveConfirmOpen = signal(false);
    archiveTargetId = signal<string | null>(null);

    deleteConfirmOpen = signal(false);
    deleteConfirmInput = signal('');
    deleteConfirmTouched = signal(false);
    deleteTargetIds = signal<string[]>([]);

    private lastActiveElement: HTMLElement | null = null;

    readonly statusOptions: MbSelectOption[] = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
    ];

    readonly formStatusOptions: MbSelectOption[] = [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
    ];

    readonly sortOptions: MbSelectOption[] = [
        { label: 'Name (A-Z)', value: 'name-asc' },
        { label: 'Name (Z-A)', value: 'name-desc' },
        { label: 'Created (Newest)', value: 'created-desc' },
        { label: 'Created (Oldest)', value: 'created-asc' },
    ];

    readonly pageSizeOptions: MbSelectOption[] = PAGE_SIZES.map(value => ({
        label: String(value),
        value: String(value),
    }));

    readonly schoolTableColumns: MbTableColumn<WorkspaceSchool>[] = [
        {
            key: 'name',
            label: 'School',
            cell: row => ({
                primary: row.name,
                secondary: `Code: ${row.code || '--'} | ${row.locationCountry || '--'}`,
            })
        },
        {
            key: 'locationCountry',
            label: 'Location',
            cell: row => row.locationCountry || '--'
        },
        {
            key: 'timeZone',
            label: 'Time zone',
            cell: row => row.timeZone || '--'
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => this.statusLabel(row.status)
        }
    ];

    readonly totalCount = computed(() => this.schools().length);
    readonly activeCount = computed(() => this.schools().filter(school => school.status === 'active').length);
    readonly archivedCount = computed(() => this.schools().filter(school => school.status === 'archived').length);

    readonly filteredSchools = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const statusFilter = this.statusFilter();
        return this.schools().filter((school) => {
            if (statusFilter !== 'all' && school.status !== statusFilter) {
                return false;
            }
            if (!query) {
                return true;
            }
            const haystack = `${school.name} ${school.code} ${school.locationCountry} ${school.city ?? ''}`.toLowerCase();
            return haystack.includes(query);
        });
    });

    readonly sortedSchools = computed(() => {
        const sorted = [...this.filteredSchools()];
        const sortBy = this.sortBy();
        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'created-desc':
                    return b.createdAt.getTime() - a.createdAt.getTime();
                case 'created-asc':
                    return a.createdAt.getTime() - b.createdAt.getTime();
                default:
                    return a.name.localeCompare(b.name);
            }
        });
        return sorted;
    });

    readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sortedSchools().length / this.pageSize())));

    readonly pagedSchools = computed(() => {
        const start = (this.pageIndex() - 1) * this.pageSize();
        return this.sortedSchools().slice(start, start + this.pageSize());
    });

    readonly filteredCount = computed(() => this.sortedSchools().length);

    readonly hasFilters = computed(() => !!this.searchQuery().trim() || this.statusFilter() !== 'all');

    readonly selectedCount = computed(() => this.selectedSchoolIds().size);

    readonly pageSizeValue = computed(() => String(this.pageSize()));

    readonly drawerSchool = computed(() => {
        const id = this.drawerSchoolId();
        return id ? this.schools().find(school => school.id === id) ?? null : null;
    });

    readonly archiveTargetName = computed(() => {
        const id = this.archiveTargetId();
        return this.schools().find(school => school.id === id)?.name || 'school';
    });

    readonly deleteConfirmRequiredText = computed(() => {
        const targets = this.deleteTargetIds();
        if (targets.length === 1) {
            return this.schools().find(school => school.id === targets[0])?.code ?? '';
        }
        return 'DELETE';
    });

    readonly deleteConfirmReady = computed(() => {
        const required = this.deleteConfirmRequiredText();
        if (!required) return false;
        return this.deleteConfirmInput().trim() === required;
    });

    readonly suggestedCode = computed(() => {
        const name = this.schoolFormName().trim();
        return name ? this.generateCode(name) : '';
    });

    readonly codeResetAvailable = computed(() => {
        if (!this.schoolFormCodeEdited()) return false;
        const suggested = this.suggestedCode();
        return !!suggested && suggested !== this.schoolFormCode();
    });

    readonly formDirty = computed(() => {
        const snapshot = this.schoolFormSnapshot();
        if (!snapshot) return false;
        const current = this.currentFormState();
        return Object.keys(snapshot).some((key) => {
            const k = key as keyof SchoolFormSnapshot;
            return snapshot[k] !== current[k];
        });
    });

    readonly invalidFields = computed(() => {
        if (!this.schoolFormSubmitAttempted()) return [];
        const errors: Array<{ id: string; label: string; message: string }> = [];
        const nameError = this.schoolNameError(true);
        const codeError = this.schoolCodeError(true);
        const countryError = this.schoolCountryError(true);
        const timezoneError = this.schoolTimezoneError(true);
        if (nameError) errors.push({ id: 'school-form-name', label: 'School name', message: nameError });
        if (codeError) errors.push({ id: 'school-form-code', label: 'Code', message: codeError });
        if (countryError) errors.push({ id: 'school-form-country', label: 'Country', message: countryError });
        if (timezoneError) errors.push({ id: 'school-form-timezone', label: 'Time zone', message: timezoneError });
        return errors;
    });

    readonly errorSummaryText = computed(() => {
        const count = this.invalidFields().length;
        if (!count) return '';
        return `Fix ${count} field${count === 1 ? '' : 's'} to continue.`;
    });

    readonly pageNumbers = computed(() => this.buildPageNumbers());

    readonly rowKey = (row: WorkspaceSchool) => row.id;

    readonly rowClass = (row: WorkspaceSchool) => {
        const classes: string[] = [];
        if (row.status === 'archived') {
            classes.push('schools-row--archived');
        }
        if (this.selectedSchoolIds().has(row.id)) {
            classes.push('schools-row--selected');
        }
        return classes.join(' ');
    };

    ngOnInit(): void {
        this.loadSchools();
    }

    @HostListener('document:keydown.escape')
    handleEscape(): void {
        if (this.isSchoolModalOpen()) {
            this.requestCloseSchoolModal();
        }
    }

    handleSearch(term: string): void {
        this.searchQuery.set(term);
        this.pageIndex.set(1);
        this.clearSelection();
    }

    updateStatusFilter(value: string): void {
        this.statusFilter.set((value as StatusFilter) || 'all');
        this.pageIndex.set(1);
        this.clearSelection();
    }

    updateSort(value: string): void {
        this.sortBy.set((value as SortOption) || 'name-asc');
        this.pageIndex.set(1);
        this.clearSelection();
    }

    updatePageSize(value: string): void {
        const nextSize = Number(value) || DEFAULT_PAGE_SIZE;
        this.pageSize.set(nextSize);
        this.pageIndex.set(1);
        this.clearSelection();
    }

    updatePage(index: number): void {
        const next = Math.min(Math.max(1, index), this.pageCount());
        this.pageIndex.set(next);
        this.clearSelection();
    }

    toggleDensity(option: DensityOption): void {
        this.density.set(option);
    }

    handleSelectionChange(selected: WorkspaceSchool[]): void {
        this.selectedSchoolIds.set(new Set(selected.map((school) => school.id)));
    }

    clearSelection(): void {
        this.selectedSchoolIds.set(new Set());
        this.closeBulkMenu();
        if (this.table) {
            this.table.selectedKeys.clear();
            this.table.selectionChange.emit([]);
        }
    }

    toggleHeaderMenu(): void {
        this.headerMenuOpen.set(!this.headerMenuOpen());
    }

    closeHeaderMenu(): void {
        this.headerMenuOpen.set(false);
    }

    toggleBulkMenu(): void {
        this.bulkMenuOpen.set(!this.bulkMenuOpen());
    }

    closeBulkMenu(): void {
        this.bulkMenuOpen.set(false);
    }

    toggleRowMenu(row: WorkspaceSchool, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.rowMenuOpenId() === row.id ? null : row.id;
        this.rowMenuOpenId.set(next);
        this.rowDangerMenuOpenId.set(null);
    }

    closeRowMenu(): void {
        this.rowMenuOpenId.set(null);
        this.rowDangerMenuOpenId.set(null);
    }

    toggleRowDangerMenu(row: WorkspaceSchool, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.rowDangerMenuOpenId() === row.id ? null : row.id;
        this.rowDangerMenuOpenId.set(next);
    }

    openDrawer(row: WorkspaceSchool): void {
        this.lastActiveElement = document.activeElement as HTMLElement | null;
        this.drawerSchoolId.set(row.id);
        this.closeRowMenu();
    }

    closeDrawer(): void {
        this.drawerSchoolId.set(null);
        this.closeRowMenu();
        if (this.lastActiveElement) {
            this.lastActiveElement.focus();
            this.lastActiveElement = null;
        }
    }

    openAddSchool(): void {
        this.editingSchoolId.set(null);
        const country = this.lastUsedCountry();
        const timezone = this.lastUsedTimezone();
        this.applyFormState({
            name: '',
            code: '',
            country,
            timezone,
            status: 'active',
            shortName: '',
            city: '',
            contactEmail: '',
            contactPhone: '',
            addressLine1: '',
            addressLine2: '',
            state: '',
            postalCode: '',
        });
        this.schoolFormCodeEdited.set(false);
        this.schoolFormAdvancedOpen.set(false);
        this.schoolFormSubmitAttempted.set(false);
        this.discardConfirmOpen.set(false);
        this.resetFormTouched();
        this.setFormSnapshot();
        this.isSchoolModalOpen.set(true);
    }

    openEditSchool(row: WorkspaceSchool): void {
        this.editingSchoolId.set(row.id);
        this.applyFormState({
            name: row.name,
            code: row.code,
            country: row.locationCountry,
            timezone: row.timeZone,
            status: row.status,
            shortName: row.shortName ?? '',
            city: row.city ?? '',
            contactEmail: row.contactEmail ?? '',
            contactPhone: row.contactPhone ?? '',
            addressLine1: row.addressLine1 ?? '',
            addressLine2: row.addressLine2 ?? '',
            state: row.state ?? '',
            postalCode: row.postalCode ?? '',
        });
        this.schoolFormCodeEdited.set(true);
        this.schoolFormAdvancedOpen.set(this.hasAdvancedFields());
        this.schoolFormSubmitAttempted.set(false);
        this.discardConfirmOpen.set(false);
        this.resetFormTouched();
        this.setFormSnapshot();
        this.isSchoolModalOpen.set(true);
    }

    requestCloseSchoolModal(): void {
        if (this.formDirty()) {
            this.discardConfirmOpen.set(true);
            return;
        }
        this.closeSchoolModal();
    }

    closeSchoolModal(): void {
        this.isSchoolModalOpen.set(false);
        this.schoolFormSnapshot.set(null);
        this.schoolFormSubmitAttempted.set(false);
        this.schoolFormAdvancedOpen.set(false);
        this.schoolFormCodeEdited.set(false);
        this.discardConfirmOpen.set(false);
    }

    confirmDiscardChanges(): void {
        this.discardConfirmOpen.set(false);
        this.closeSchoolModal();
    }

    closeDiscardConfirm(): void {
        this.discardConfirmOpen.set(false);
    }

    saveAndAddAnother(): void {
        this.saveSchool(true);
    }

    saveSchool(keepOpen = false): void {
        if (!this.canSaveSchool()) {
            this.schoolFormSubmitAttempted.set(true);
            return;
        }
        this.schoolFormSubmitAttempted.set(false);
        this.isSaving.set(true);
        const payload = this.buildSchoolPayload();
        const editingId = this.editingSchoolId();
        if (editingId) {
            this.schools.update(list => list.map(school => school.id === editingId ? {
                ...school,
                ...payload,
                updatedAt: new Date(),
            } : school));
            this.toast.success('School updated.');
        } else {
            this.schools.update(list => [
                ...list,
                {
                    id: this.generateId(),
                    ...payload,
                    createdAt: new Date(),
                }
            ]);
            this.toast.success('School added.');
        }
        this.lastUsedCountry.set(this.schoolFormCountry().trim());
        this.lastUsedTimezone.set(this.schoolFormTimezone().trim());
        this.isSaving.set(false);
        if (keepOpen) {
            this.openAddSchool();
        } else {
            this.closeSchoolModal();
        }
    }

    duplicateSchool(row: WorkspaceSchool): void {
        this.editingSchoolId.set(null);
        const name = `${row.name} Copy`;
        const code = row.code ? `${row.code}-copy` : this.generateCode(name);
        this.applyFormState({
            name,
            code,
            country: row.locationCountry,
            timezone: row.timeZone,
            status: 'active',
            shortName: row.shortName ?? '',
            city: row.city ?? '',
            contactEmail: row.contactEmail ?? '',
            contactPhone: row.contactPhone ?? '',
            addressLine1: row.addressLine1 ?? '',
            addressLine2: row.addressLine2 ?? '',
            state: row.state ?? '',
            postalCode: row.postalCode ?? '',
        });
        this.schoolFormCodeEdited.set(true);
        this.schoolFormAdvancedOpen.set(this.hasAdvancedFields());
        this.schoolFormSubmitAttempted.set(false);
        this.discardConfirmOpen.set(false);
        this.resetFormTouched();
        this.setFormSnapshot();
        this.isSchoolModalOpen.set(true);
    }

    onSchoolNameChange(value: string): void {
        this.schoolFormName.set(value);
        if (!this.schoolFormCodeEdited()) {
            this.schoolFormCode.set(this.suggestedCode());
        }
    }

    onSchoolCodeChange(value: string): void {
        const normalized = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .slice(0, CODE_MAX_LENGTH);
        this.schoolFormCode.set(normalized);
        this.schoolFormCodeEdited.set(true);
    }

    resetCodeSuggestion(): void {
        const suggested = this.suggestedCode();
        if (!suggested) return;
        this.schoolFormCode.set(suggested);
        this.schoolFormCodeEdited.set(false);
    }

    onSchoolCountryChange(value: string): void {
        this.schoolFormCountry.set(value);
        if (!this.schoolFormTimezone().trim() && this.lastUsedTimezone()) {
            this.schoolFormTimezone.set(this.lastUsedTimezone());
        }
    }

    onSchoolStatusChange(value: string): void {
        this.schoolFormStatus.set(value as SchoolStatus);
    }

    onSchoolTimezoneChange(value: string): void {
        this.schoolFormTimezone.set(value);
    }

    toggleAdvanced(): void {
        this.schoolFormAdvancedOpen.update(value => !value);
    }

    focusField(id: string): void {
        const element = document.getElementById(id) as HTMLElement | null;
        element?.focus();
    }

    openArchiveConfirm(row: WorkspaceSchool): void {
        this.archiveTargetId.set(row.id);
        this.archiveConfirmOpen.set(true);
    }

    closeArchiveConfirm(): void {
        this.archiveConfirmOpen.set(false);
        this.archiveTargetId.set(null);
    }

    confirmArchive(): void {
        const targetId = this.archiveTargetId();
        if (!targetId) return;
        this.schools.update(list => list.map(school => school.id === targetId ? {
            ...school,
            status: 'archived',
            updatedAt: new Date(),
        } : school));
        this.toast.success('School archived.');
        this.closeArchiveConfirm();
    }

    restoreSchool(row: WorkspaceSchool): void {
        this.schools.update(list => list.map(school => school.id === row.id ? {
            ...school,
            status: 'active',
            updatedAt: new Date(),
        } : school));
        this.toast.success('School restored.');
    }

    openDeleteConfirm(targets: WorkspaceSchool[]): void {
        this.deleteTargetIds.set(targets.map(school => school.id));
        this.deleteConfirmInput.set('');
        this.deleteConfirmTouched.set(false);
        this.deleteConfirmOpen.set(true);
    }

    closeDeleteConfirm(): void {
        this.deleteConfirmOpen.set(false);
        this.deleteTargetIds.set([]);
        this.deleteConfirmInput.set('');
        this.deleteConfirmTouched.set(false);
    }

    confirmDelete(): void {
        if (!this.deleteConfirmReady()) {
            this.deleteConfirmTouched.set(true);
            return;
        }
        const ids = new Set(this.deleteTargetIds());
        this.schools.update(list => list.filter(school => !ids.has(school.id)));
        this.toast.success(ids.size > 1 ? 'Schools deleted.' : 'School deleted.');
        this.clearSelection();
        this.ensurePageInRange();
        this.closeDeleteConfirm();
    }

    bulkArchive(): void {
        const ids = this.selectedSchoolIds();
        if (!ids.size) return;
        this.schools.update(list => list.map(school => ids.has(school.id) ? {
            ...school,
            status: 'archived',
            updatedAt: new Date(),
        } : school));
        this.toast.success('Schools archived.');
        this.clearSelection();
        this.closeBulkMenu();
    }

    bulkExport(): void {
        this.toast.info('Export queued.');
    }

    headerExport(): void {
        this.toast.info('Export queued.');
        this.closeHeaderMenu();
    }

    headerImport(): void {
        this.toast.info('Import CSV coming soon.');
        this.closeHeaderMenu();
    }

    viewArchived(): void {
        this.statusFilter.set('archived');
        this.pageIndex.set(1);
        this.clearSelection();
        this.closeHeaderMenu();
    }

    clearFilters(): void {
        this.searchQuery.set('');
        this.statusFilter.set('all');
        this.pageIndex.set(1);
        this.clearSelection();
    }

    openBulkDelete(): void {
        const targets = this.schools().filter(school => this.selectedSchoolIds().has(school.id));
        if (!targets.length) return;
        this.openDeleteConfirm(targets);
        this.closeBulkMenu();
    }

    statusLabel(status: SchoolStatus): string {
        return STATUS_LABELS[status] ?? '--';
    }

    formatDate(value?: Date): string {
        if (!value) return '--';
        return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(value);
    }

    canSaveSchool(): boolean {
        return !this.schoolNameError(true)
            && !this.schoolCodeError(true)
            && !this.schoolCountryError(true)
            && !this.schoolTimezoneError(true);
    }

    buildSchoolPayload(): Omit<WorkspaceSchool, 'id' | 'createdAt'> {
        const editingId = this.editingSchoolId();
        return {
            name: this.schoolFormName().trim(),
            code: this.schoolFormCode().trim(),
            locationCountry: this.schoolFormCountry().trim(),
            timeZone: this.schoolFormTimezone().trim(),
            status: this.schoolFormStatus(),
            updatedAt: new Date(),
            shortName: this.schoolFormShortName().trim(),
            city: this.schoolFormCity().trim(),
            contactEmail: this.schoolFormContactEmail().trim(),
            contactPhone: this.schoolFormContactPhone().trim(),
            addressLine1: this.schoolFormAddressLine1().trim(),
            addressLine2: this.schoolFormAddressLine2().trim(),
            state: this.schoolFormState().trim(),
            postalCode: this.schoolFormPostalCode().trim(),
        };
    }

    schoolNameError(force = false): string {
        if (!this.shouldShowError(this.schoolFormNameTouched(), force)) return '';
        if (!this.schoolFormName().trim()) return 'School name is required.';
        return '';
    }

    schoolCodeError(force = false): string {
        if (!this.shouldShowError(this.schoolFormCodeTouched(), force)) return '';
        const code = this.schoolFormCode().trim();
        if (!code) return 'School code is required.';
        if (code.length < CODE_MIN_LENGTH || code.length > CODE_MAX_LENGTH) {
            return `Use ${CODE_MIN_LENGTH}-${CODE_MAX_LENGTH} characters.`;
        }
        if (!/^[a-z0-9-]+$/.test(code)) {
            return 'Use lowercase letters, numbers, and hyphens only.';
        }
        if (code.startsWith('-') || code.endsWith('-')) {
            return 'Do not start or end with a hyphen.';
        }
        if (code.includes('--')) {
            return 'Avoid double hyphens.';
        }
        if (this.codeExists(code)) {
            return 'Code already in use.';
        }
        return '';
    }

    schoolCountryError(force = false): string {
        if (!this.shouldShowError(this.schoolFormCountryTouched(), force)) return '';
        if (!this.schoolFormCountry().trim()) return 'Country is required.';
        return '';
    }

    schoolTimezoneError(force = false): string {
        if (!this.shouldShowError(this.schoolFormTimezoneTouched(), force)) return '';
        if (!this.schoolFormTimezone().trim()) return 'Time zone is required.';
        return '';
    }

    private shouldShowError(touched: boolean, force: boolean): boolean {
        return force || this.schoolFormSubmitAttempted() || touched;
    }

    private codeExists(code: string): boolean {
        const normalized = code.trim().toLowerCase();
        if (!normalized) return false;
        const editingId = this.editingSchoolId();
        return this.schools().some((school) => {
            if (editingId && school.id === editingId) return false;
            return school.code?.toLowerCase() === normalized;
        });
    }

    private applyFormState(state: SchoolFormSnapshot): void {
        this.schoolFormName.set(state.name);
        this.schoolFormCode.set(state.code);
        this.schoolFormCountry.set(state.country);
        this.schoolFormTimezone.set(state.timezone);
        this.schoolFormStatus.set(state.status);
        this.schoolFormShortName.set(state.shortName);
        this.schoolFormCity.set(state.city);
        this.schoolFormContactEmail.set(state.contactEmail);
        this.schoolFormContactPhone.set(state.contactPhone);
        this.schoolFormAddressLine1.set(state.addressLine1);
        this.schoolFormAddressLine2.set(state.addressLine2);
        this.schoolFormState.set(state.state);
        this.schoolFormPostalCode.set(state.postalCode);
    }

    private resetFormTouched(): void {
        this.schoolFormNameTouched.set(false);
        this.schoolFormCodeTouched.set(false);
        this.schoolFormCountryTouched.set(false);
        this.schoolFormTimezoneTouched.set(false);
    }

    private setFormSnapshot(): void {
        this.schoolFormSnapshot.set(this.currentFormState());
    }

    private currentFormState(): SchoolFormSnapshot {
        return {
            name: this.schoolFormName(),
            code: this.schoolFormCode(),
            country: this.schoolFormCountry(),
            timezone: this.schoolFormTimezone(),
            status: this.schoolFormStatus(),
            shortName: this.schoolFormShortName(),
            city: this.schoolFormCity(),
            contactEmail: this.schoolFormContactEmail(),
            contactPhone: this.schoolFormContactPhone(),
            addressLine1: this.schoolFormAddressLine1(),
            addressLine2: this.schoolFormAddressLine2(),
            state: this.schoolFormState(),
            postalCode: this.schoolFormPostalCode(),
        };
    }

    private hasAdvancedFields(): boolean {
        return !!this.schoolFormContactEmail().trim()
            || !!this.schoolFormContactPhone().trim()
            || !!this.schoolFormAddressLine1().trim()
            || !!this.schoolFormAddressLine2().trim()
            || !!this.schoolFormState().trim()
            || !!this.schoolFormPostalCode().trim();
    }

    private buildPageNumbers(): number[] {
        const total = this.pageCount();
        const current = this.pageIndex();
        const windowSize = 5;
        if (total <= windowSize) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const start = Math.max(1, current - 2);
        const end = Math.min(total, start + windowSize - 1);
        const adjustedStart = Math.max(1, end - windowSize + 1);
        return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
    }

    private generateId(): string {
        return `sch-${Math.random().toString(36).slice(2, 9)}`;
    }

    private loadSchools(): void {
        this.api.get<School[]>('schools').subscribe({
            next: (schools) => {
                const list = Array.isArray(schools) ? schools : [];
                const mapped = list.map((school) => this.toWorkspaceSchool(school));
                this.schools.set(mapped);
                if (mapped.length) {
                    if (!this.lastUsedCountry()) {
                        this.lastUsedCountry.set(mapped[0].locationCountry || '');
                    }
                    if (!this.lastUsedTimezone()) {
                        this.lastUsedTimezone.set(mapped[0].timeZone || '');
                    }
                }
            },
            error: () => {
                this.toast.error('Unable to load schools. Please try again.');
            },
        });
    }

    private ensurePageInRange(): void {
        const max = this.pageCount();
        if (this.pageIndex() > max) {
            this.pageIndex.set(max);
        }
    }

    private toWorkspaceSchool(school: School): WorkspaceSchool {
        return {
            id: school.id,
            name: school.name,
            code: school.code ?? '',
            locationCountry: school.address?.country ?? '',
            timeZone: (school.settings as { timezone?: string } | undefined)?.timezone ?? '',
            status: school.status === 'archived' ? 'archived' : 'active',
            createdAt: school.createdAt ? new Date(school.createdAt) : new Date(),
            updatedAt: school.updatedAt ? new Date(school.updatedAt) : undefined,
            shortName: (school.settings as { shortName?: string } | undefined)?.shortName ?? '',
            city: school.address?.city ?? '',
            contactEmail: school.contact?.email ?? '',
            contactPhone: school.contact?.phone ?? '',
            addressLine1: school.address?.street ?? '',
            addressLine2: '',
            state: school.address?.state ?? '',
            postalCode: school.address?.postalCode ?? '',
        };
    }

    private generateCode(name: string): string {
        const normalized = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\\s-]/g, '')
            .replace(/\\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, CODE_MAX_LENGTH);
        return normalized || 'school';
    }
}
