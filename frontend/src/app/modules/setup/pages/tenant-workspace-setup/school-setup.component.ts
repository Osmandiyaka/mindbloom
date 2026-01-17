import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { MbSelectOption, MbTableColumn, MbTableComponent } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { ToastService } from '../../../../core/ui/toast/toast.service';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZES = [10, 25, 50];

const STATUS_LABELS: Record<SchoolStatus, string> = {
    active: 'Active',
    archived: 'Archived',
};

const SEED_SCHOOLS: WorkspaceSchool[] = [
    {
        id: 'sch-001',
        name: 'Brookfield Academy',
        code: 'brookfield',
        locationCountry: 'United States',
        timeZone: 'America/New_York',
        status: 'active',
        createdAt: new Date('2022-05-16T09:15:00Z'),
        updatedAt: new Date('2024-02-12T14:20:00Z'),
    },
    {
        id: 'sch-002',
        name: 'Evergreen International',
        code: 'evergreen-intl',
        locationCountry: 'United Kingdom',
        timeZone: 'Europe/London',
        status: 'active',
        createdAt: new Date('2023-01-09T10:40:00Z'),
        updatedAt: new Date('2024-03-01T08:00:00Z'),
    },
    {
        id: 'sch-003',
        name: 'Maple Ridge School',
        code: 'maple-ridge',
        locationCountry: 'Canada',
        timeZone: 'America/Toronto',
        status: 'archived',
        createdAt: new Date('2021-10-20T12:00:00Z'),
        updatedAt: new Date('2023-11-05T12:00:00Z'),
    },
    {
        id: 'sch-004',
        name: 'Lagoonview College',
        code: 'lagoonview',
        locationCountry: 'Nigeria',
        timeZone: 'Africa/Lagos',
        status: 'active',
        createdAt: new Date('2024-01-15T09:30:00Z'),
        updatedAt: new Date('2024-02-18T15:45:00Z'),
    },
    {
        id: 'sch-005',
        name: 'Sunrise STEM Institute',
        code: 'sunrise-stem',
        locationCountry: 'Kenya',
        timeZone: 'Africa/Nairobi',
        status: 'active',
        createdAt: new Date('2022-07-04T08:00:00Z'),
        updatedAt: new Date('2023-08-14T16:10:00Z'),
    },
];

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
};

@Component({
    selector: 'app-tenant-schools',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './school-setup.component.html',
    styleUrls: ['./school-setup.component.scss']
})
export class TenantSchoolsComponent {
    private readonly toast = inject(ToastService);

    @ViewChild(MbTableComponent) table?: MbTableComponent<WorkspaceSchool>;

    schools = signal<WorkspaceSchool[]>(SEED_SCHOOLS);
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
    schoolFormTouched = signal(false);

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
            const haystack = `${school.name} ${school.code} ${school.locationCountry}`.toLowerCase();
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
        this.schoolFormName.set('');
        this.schoolFormCode.set('');
        this.schoolFormCountry.set('');
        this.schoolFormTimezone.set('');
        this.schoolFormTouched.set(false);
        this.isSchoolModalOpen.set(true);
    }

    openEditSchool(row: WorkspaceSchool): void {
        this.editingSchoolId.set(row.id);
        this.schoolFormName.set(row.name);
        this.schoolFormCode.set(row.code);
        this.schoolFormCountry.set(row.locationCountry);
        this.schoolFormTimezone.set(row.timeZone);
        this.schoolFormTouched.set(false);
        this.isSchoolModalOpen.set(true);
    }

    closeSchoolModal(): void {
        this.isSchoolModalOpen.set(false);
    }

    saveSchool(): void {
        if (!this.canSaveSchool()) {
            this.schoolFormTouched.set(true);
            return;
        }
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
        this.closeSchoolModal();
    }

    duplicateSchool(row: WorkspaceSchool): void {
        this.editingSchoolId.set(null);
        const name = `${row.name} Copy`;
        const code = row.code ? `${row.code}-copy` : this.generateCode(name);
        this.schoolFormName.set(name);
        this.schoolFormCode.set(code);
        this.schoolFormCountry.set(row.locationCountry);
        this.schoolFormTimezone.set(row.timeZone);
        this.schoolFormTouched.set(false);
        this.isSchoolModalOpen.set(true);
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
        return !!this.schoolFormName().trim()
            && !!this.schoolFormCode().trim()
            && !!this.schoolFormCountry().trim()
            && !!this.schoolFormTimezone().trim();
    }

    buildSchoolPayload(): Omit<WorkspaceSchool, 'id' | 'createdAt'> {
        const editingId = this.editingSchoolId();
        const existingStatus = editingId
            ? this.schools().find(school => school.id === editingId)?.status
            : undefined;
        return {
            name: this.schoolFormName().trim(),
            code: this.schoolFormCode().trim(),
            locationCountry: this.schoolFormCountry().trim(),
            timeZone: this.schoolFormTimezone().trim(),
            status: existingStatus ?? 'active',
            updatedAt: new Date(),
        };
    }

    schoolNameError(): string {
        if (!this.schoolFormTouched()) return '';
        if (!this.schoolFormName().trim()) return 'School name is required.';
        return '';
    }

    schoolCodeError(): string {
        if (!this.schoolFormTouched()) return '';
        if (!this.schoolFormCode().trim()) return 'School code is required.';
        return '';
    }

    schoolCountryError(): string {
        if (!this.schoolFormTouched()) return '';
        if (!this.schoolFormCountry().trim()) return 'Country is required.';
        return '';
    }

    schoolTimezoneError(): string {
        if (!this.schoolFormTouched()) return '';
        if (!this.schoolFormTimezone().trim()) return 'Time zone is required.';
        return '';
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

    private ensurePageInRange(): void {
        const max = this.pageCount();
        if (this.pageIndex() > max) {
            this.pageIndex.set(max);
        }
    }

    private generateCode(name: string): string {
        return name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\\s-]/g, '')
            .replace(/\\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 32) || 'school';
    }
}
