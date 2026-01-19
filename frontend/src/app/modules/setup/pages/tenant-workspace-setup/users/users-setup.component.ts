import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MbTableColumn, MbTableDensity, MbTableEmptyState } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { CreateUserModalComponent } from './create-user-modal.component';
import { InviteUsersModalComponent } from './invite-users-modal.component';
import { ViewUserDrawerComponent } from './view-user-drawer.component';
import { UsersStore } from './users.store';
import { CreateUserFormState, ExistingUserRow, InviteUsersFormState, SchoolAccess, UserListItem, UserStatus } from './users.types';
import { mapCreateUserFormToApiPayload, mapEditUserFormToApiPayload, mapInviteUsersFormToApiPayload } from './user-form.mapper';
import { UserSerivce } from './user-serivce.service';

type DirectoryUserRow = {
    id: string;
    name: string;
    email: string;
    roleName: string | null;
    roleIds: string[];
    status: UserStatus;
    schoolAccess: SchoolAccess;
    lastLoginAt: number | null;
    lastLoginLabel: string;
    source: UserListItem;
};

@Component({
    selector: 'app-tenant-users',
    standalone: true,
    imports: [
        ...TENANT_WORKSPACE_SETUP_IMPORTS,
        CreateUserModalComponent,
        InviteUsersModalComponent,
        ViewUserDrawerComponent,
    ],
    templateUrl: './users-setup.component.html',
    styleUrls: ['./users-setup.component.scss']
})
export class TenantUsersComponent implements OnInit {
    readonly vm = this;
    private readonly setup = inject(TenantWorkspaceSetupFacade);
    private readonly usersApi = inject(UserSerivce);
    readonly store = inject(UsersStore);
    private readonly route = inject(ActivatedRoute);

    density = signal<MbTableDensity>('comfortable');
    rowsPerPage = signal(20);
    pageIndex = signal(1);
    columnsMenuOpen = signal(false);
    roleFilterOpen = signal(false);
    selectedRows = signal<DirectoryUserRow[]>([]);
    bulkRoleOpen = signal(false);
    bulkAccessOpen = signal(false);
    bulkRoleIds = signal<string[]>([]);
    bulkSchoolIds = signal<string[]>([]);
    bulkSchoolScope = signal<'all' | 'selected'>('all');
    bulkConfirmOpen = signal<null | 'suspend' | 'remove'>(null);

    userMenuOpenId = signal<string | null>(null);
    usersStepSkipped = signal(false);
    isInviteModalOpen = signal(false);
    isCreateUserModalOpen = signal(false);
    isViewUserModalOpen = signal(false);
    isDeleteConfirmOpen = signal(false);
    isSuspendConfirmOpen = signal(false);
    suspendTarget = signal<ExistingUserRow | null>(null);
    selectedUser = signal<ExistingUserRow | null>(null);
    editPreset = signal<Partial<CreateUserFormState> | null>(null);
    editUserId = signal<string | null>(null);
    editingUserEmail = signal<string | null>(null);
    deleteTarget = signal<UserListItem | null>(null);
    statusFilter = signal<'all' | UserStatus>('all');
    schoolAccessFilter = signal<'any' | 'all' | 'selected'>('any');
    roleFilterIds = signal<string[]>([]);

    readonly existingEmails = computed(() => {
        const currentEmail = this.editingUserEmail()?.toLowerCase();
        return this.store.users()
            .filter(item => item.kind === 'existing')
            .map(item => item.email)
            .filter(email => !currentEmail || email.toLowerCase() !== currentEmail);
    });

    readonly addUsersMenuItems = computed(() => ([
        { label: 'Invite by email', value: 'invite' },
        {
            label: 'Create user manually',
            value: 'create',
            disabled: !this.store.canCreateUsers(),
            description: this.store.canCreateUsers() ? undefined : 'Only workspace owners can create users.',
        },
        { type: 'divider' as const },
        { label: 'Import CSV', value: 'import' },
    ]));

    readonly userTableColumns: MbTableColumn<DirectoryUserRow>[] = [
        {
            key: 'name',
            label: 'User',
            sortable: true,
            cell: row => ({
                primary: row.name,
                secondary: row.email,
                badges: row.status === 'invited' ? [{ label: 'Invite sent', tone: 'neutral' }] : [],
                icon: { symbol: this.userInitials(row), title: row.name },
            }),
        },
        {
            key: 'roleName',
            label: 'Role',
            sortable: true,
            cell: row => row.roleName || {
                primary: 'Unassigned',
                badges: [{ label: 'Unassigned', tone: 'neutral' }],
            },
        },
        {
            key: 'schoolAccess',
            label: 'School access',
            cell: row => this.schoolAccessLabel(row.source)
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            cell: row => ({
                primary: this.statusLabel(row.status),
                badges: [{ label: this.statusLabel(row.status), tone: this.statusTone(row.status) }],
            }),
        },
        {
            key: 'lastLoginAt',
            label: 'Last login',
            sortable: true,
            cell: row => row.lastLoginLabel,
        },
    ];

    readonly visibleColumnKeys = signal<string[]>([
        'name',
        'roleName',
        'schoolAccess',
        'status',
        'lastLoginAt',
    ]);

    readonly visibleColumns = computed(() =>
        this.userTableColumns.filter(column => this.visibleColumnKeys().includes(String(column.key)))
    );

    readonly isFiltered = computed(() =>
        this.store.userSearch().trim().length > 0
        || this.statusFilter() !== 'all'
        || this.schoolAccessFilter() !== 'any'
        || this.roleFilterIds().length > 0
    );

    readonly directoryRows = computed<DirectoryUserRow[]>(() => {
        const query = this.store.userSearch().trim().toLowerCase();
        const statusFilter = this.statusFilter();
        const accessFilter = this.schoolAccessFilter();
        const roleIds = this.roleFilterIds();
        return this.store.users()
            .filter(user => {
                if (statusFilter !== 'all' && user.status !== statusFilter) {
                    return false;
                }
                if (accessFilter !== 'any') {
                    if (accessFilter === 'all' && user.schoolAccess.scope !== 'all') return false;
                    if (accessFilter === 'selected' && user.schoolAccess.scope !== 'selected') return false;
                }
                if (roleIds.length && !roleIds.some(roleId => user.roleIds.includes(roleId))) {
                    return false;
                }
                if (!query) return true;
                const name = user.kind === 'existing' ? user.name : '';
                const roleName = user.roleName ?? '';
                return name.toLowerCase().includes(query)
                    || user.email.toLowerCase().includes(query)
                    || roleName.toLowerCase().includes(query);
            })
            .map(user => {
                const displayName = user.kind === 'existing' ? user.name : 'Pending invite';
                const { label, timestamp } = this.lastLoginInfo(user);
                return {
                    id: user.id,
                    name: displayName || user.email,
                    email: user.email,
                    roleName: user.roleName,
                    roleIds: user.roleIds,
                    status: user.status,
                    schoolAccess: user.schoolAccess,
                    lastLoginAt: timestamp,
                    lastLoginLabel: label,
                    source: user,
                };
            });
    });

    readonly pagedRows = computed(() => {
        const pageSize = this.rowsPerPage();
        const page = Math.min(this.pageIndex(), this.pageCount());
        const start = (page - 1) * pageSize;
        return this.directoryRows().slice(start, start + pageSize);
    });

    readonly pageCount = computed(() => {
        const total = this.directoryRows().length;
        return Math.max(1, Math.ceil(total / this.rowsPerPage()));
    });

    readonly selectedCount = computed(() => this.selectedRows().length);
    readonly selectedExisting = computed(() =>
        this.selectedRows().map(row => row.source).filter(row => row.kind === 'existing') as ExistingUserRow[]
    );
    readonly selectedPending = computed(() =>
        this.selectedRows().map(row => row.source).filter(row => row.kind === 'pendingInvite')
    );

    readonly tableEmptyState = computed<MbTableEmptyState>(() => {
        if (this.isFiltered()) {
            return {
                variant: 'filtered',
                title: 'No results',
                description: 'Try adjusting filters or search terms.',
                actions: [{ id: 'clearFilters', label: 'Clear filters', variant: 'primary' }],
            };
        }
        return {
            title: 'No users yet',
            description: 'Invite users to access the workspace and assign roles and school access.',
            actions: [
                { id: 'addUsers', label: 'Add users', variant: 'primary' },
                { id: 'importCsv', label: 'Import CSV', variant: 'secondary' },
                { id: 'learnMore', label: 'Learn more', variant: 'tertiary' },
            ],
        };
    });

    readonly tableSummary = computed(() => {
        const total = this.store.users().length;
        const shown = this.directoryRows().length;
        const label = `Showing ${shown} user${shown === 1 ? '' : 's'}`;
        if (!this.isFiltered() || total === shown) {
            return label;
        }
        return `${label} • Filtered from ${total}`;
    });

    readonly canContinueUsersStep = computed(() =>
        this.store.users().some(item => item.kind === 'existing') || this.usersStepSkipped()
    );

    ngOnInit(): void {
        this.store.connect(this.usersApi, this.setup);
        this.store.loadUsers();
        this.usersStepSkipped.set(this.setup.usersStepSkipped());
        this.route.queryParamMap.subscribe(params => {
            const term = params.get('userSearch');
            if (term === null) return;
            this.store.setSearch(term);
            this.pageIndex.set(1);
        });
    }

    handleRowClick(row: DirectoryUserRow): void {
        if (row.source.kind !== 'existing') return;
        this.openViewUser(row.source);
    }

    toggleUserMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.userMenuOpenId() === id ? null : id;
        this.userMenuOpenId.set(next);
    }

    userMenuKey(row: DirectoryUserRow): string {
        return row.id;
    }

    closeUserMenu(): void {
        this.userMenuOpenId.set(null);
    }

    rowKey = (row: DirectoryUserRow) => row.id;

    trackUserRow = (_: number, user: DirectoryUserRow) => user.id;

    openInviteModal(): void {
        this.isInviteModalOpen.set(true);
    }

    closeInviteModal(): void {
        this.isInviteModalOpen.set(false);
    }

    openCreateUserModal(): void {
        this.isCreateUserModalOpen.set(true);
    }

    closeCreateUserModal(): void {
        this.isCreateUserModalOpen.set(false);
        this.editPreset.set(null);
        this.editUserId.set(null);
        this.editingUserEmail.set(null);
    }

    openEditUser(user: ExistingUserRow): void {
        this.usersApi.getUser(user.id).subscribe({
            next: (fresh) => {
                console.log('Fetched fresh user data for edit:', fresh);
                this.editUserId.set(fresh.id);
                this.editingUserEmail.set(fresh.email);
                this.editPreset.set({
                    name: fresh.name,
                    email: fresh.email,
                    phone: fresh.phone ?? '',
                    roleIds: fresh.roleIds ?? [],
                    roleNames: fresh.roles?.map(role => role.name) ?? [],
                    schoolAccessScope: fresh.schoolAccess?.scope ?? 'all',
                    selectedSchoolIds: fresh.schoolAccess?.scope === 'selected'
                        ? fresh.schoolAccess.schoolIds
                        : [],
                    profilePicture: fresh.profilePicture ?? null,
                    status: fresh.status ?? user.status,
                    jobTitle: user.jobTitle || '',
                    department: user.department || '',
                    gender: user.gender || '',
                    dateOfBirth: user.dateOfBirth || '',
                });
                this.openCreateUserModal();
            },
        });
    }

    openViewUser(user: ExistingUserRow): void {
        this.selectedUser.set(user);
        this.isViewUserModalOpen.set(true);
    }

    closeViewUser(): void {
        this.selectedUser.set(null);
        this.isViewUserModalOpen.set(false);
    }

    handleCreateSubmitted(form: CreateUserFormState): void {
        const editUserId = this.editUserId();
        if (editUserId) {
            const payload = mapEditUserFormToApiPayload(form);
            this.store.updateUser(editUserId, payload);
        } else {
            const payload = mapCreateUserFormToApiPayload(form);
            this.store.createUser(payload);
        }
        this.closeCreateUserModal();
    }

    handleInviteSubmitted(form: InviteUsersFormState): void {
        const payload = mapInviteUsersFormToApiPayload(form);
        this.store.inviteUsers(payload);
        this.closeInviteModal();
    }



    resendInvite(row: UserListItem): void {
        if (row.kind !== 'existing') return;
        this.store.updateUser(row.id, {});
    }

    sendPasswordReset(row: UserListItem): void {
        if (row.kind !== 'existing') return;
        this.store.updateUser(row.id, { forcePasswordReset: true });
    }

    toggleUserStatus(row: UserListItem, nextStatus?: UserStatus): void {
        if (row.kind !== 'existing') return;
        const resolved = nextStatus ?? (row.status === 'suspended' ? 'active' : 'suspended');
        if (resolved === 'suspended') {
            this.suspendTarget.set(row);
            this.isSuspendConfirmOpen.set(true);
            return;
        }
        this.store.toggleUserStatus(row.id, resolved);
    }

    removeUser(row: UserListItem): void {
        if (row.kind === 'pendingInvite') {
            this.store.removeUser(row.id);
            return;
        }
        this.deleteTarget.set(row);
        this.isDeleteConfirmOpen.set(true);
    }

    cancelDelete(): void {
        this.deleteTarget.set(null);
        this.isDeleteConfirmOpen.set(false);
    }

    confirmDelete(): void {
        const target = this.deleteTarget();
        if (!target) return;
        if (target.kind === 'pendingInvite') {
            this.store.removeUser(target.id);
        } else {
            this.store.deleteUser(target.id);
        }
        this.deleteTarget.set(null);
        this.isDeleteConfirmOpen.set(false);
    }

    cancelSuspend(): void {
        this.suspendTarget.set(null);
        this.isSuspendConfirmOpen.set(false);
    }

    confirmSuspend(): void {
        const target = this.suspendTarget();
        if (!target) return;
        this.store.toggleUserStatus(target.id, 'suspended');
        this.suspendTarget.set(null);
        this.isSuspendConfirmOpen.set(false);
    }

    clearSelection(): void {
        this.selectedRows.set([]);
    }

    handleSelectionChange(rows: DirectoryUserRow[]): void {
        this.selectedRows.set(rows);
    }

    openBulkRole(): void {
        this.bulkRoleIds.set([]);
        this.bulkRoleOpen.set(true);
    }

    closeBulkRole(): void {
        this.bulkRoleOpen.set(false);
    }

    confirmBulkRole(): void {
        const roleIds = this.bulkRoleIds();
        if (!roleIds.length) {
            this.bulkRoleOpen.set(false);
            return;
        }
        const existing = this.selectedExisting();
        existing.forEach(user => this.store.updateUser(user.id, { roleIds }));
        const pendingIds = new Set(this.selectedPending().map(row => row.id));
        if (pendingIds.size) {
            this.store.users.update(items => items.map(item => {
                if (item.kind !== 'pendingInvite' || !pendingIds.has(item.id)) return item;
                return { ...item, roleIds };
            }));
        }
        this.bulkRoleOpen.set(false);
        this.clearSelection();
    }

    openBulkAccess(): void {
        this.bulkSchoolScope.set('all');
        this.bulkSchoolIds.set([]);
        this.bulkAccessOpen.set(true);
    }

    closeBulkAccess(): void {
        this.bulkAccessOpen.set(false);
    }

    confirmBulkAccess(): void {
        const scope = this.bulkSchoolScope();
        const schoolAccess: SchoolAccess = scope === 'selected'
            ? { scope: 'selected', schoolIds: this.bulkSchoolIds() }
            : { scope: 'all' };
        const existing = this.selectedExisting();
        existing.forEach(user => this.store.updateUser(user.id, { schoolAccess }));
        const pendingIds = new Set(this.selectedPending().map(row => row.id));
        if (pendingIds.size) {
            this.store.users.update(items => items.map(item => {
                if (item.kind !== 'pendingInvite' || !pendingIds.has(item.id)) return item;
                return { ...item, schoolAccess };
            }));
        }
        this.bulkAccessOpen.set(false);
        this.clearSelection();
    }

    openBulkConfirm(action: 'suspend' | 'remove'): void {
        this.bulkConfirmOpen.set(action);
    }

    closeBulkConfirm(): void {
        this.bulkConfirmOpen.set(null);
    }

    confirmBulkSuspend(): void {
        const existing = this.selectedExisting();
        existing.forEach(user => this.store.toggleUserStatus(user.id, 'suspended'));
        this.bulkConfirmOpen.set(null);
        this.clearSelection();
    }

    confirmBulkRemove(): void {
        const existing = this.selectedExisting();
        const pending = this.selectedPending();
        existing.forEach(user => this.store.deleteUser(user.id));
        pending.forEach(invite => this.store.removeUser(invite.id));
        this.bulkConfirmOpen.set(null);
        this.clearSelection();
    }

    handleAddUsersAction(action: string, csvInput: HTMLInputElement): void {
        switch (action) {
            case 'invite':
                this.openInviteModal();
                break;
            case 'create':
                if (this.store.canCreateUsers()) {
                    this.openCreateUserModal();
                }
                break;
            case 'import':
                csvInput.click();
                break;
            default:
                break;
        }
    }

    handleCsvImport(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            if (text) {
                this.store.importCsvUsers(text);
            }
            input.value = '';
        };
        reader.onerror = () => {
            input.value = '';
        };
        reader.readAsText(file);
    }

    handleEmptyAction(action: string, csvInput: HTMLInputElement): void {
        if (action === 'clearFilters') {
            this.clearFilters();
            return;
        }
        if (action === 'addUsers') {
            this.openInviteModal();
            return;
        }
        if (action === 'importCsv') {
            csvInput.click();
        }
    }

    back(): void {
        this.setup.back();
    }

    next(): void {
        this.setup.next();
    }

    skipUsersStep(): void {
        this.usersStepSkipped.set(true);
        this.setup.attemptedContinue.set(false);
        this.setup.next();
    }

    schoolAccessLabel(user: UserListItem): string {
        if (user.schoolAccess.scope === 'all') return 'All schools';
        const count = user.schoolAccess.schoolIds.length;
        return count === 1 ? '1 school' : `${count} schools`;
    }

    setStatusFilter(value: string): void {
        if (value === 'all') {
            this.statusFilter.set('all');
            return;
        }
        this.statusFilter.set(value as UserStatus);
    }

    setSchoolAccessFilter(value: string): void {
        if (value === 'any') {
            this.schoolAccessFilter.set('any');
            return;
        }
        this.schoolAccessFilter.set(value as 'all' | 'selected');
    }

    toggleColumnsMenu(): void {
        this.columnsMenuOpen.set(!this.columnsMenuOpen());
    }

    closeColumnsMenu(): void {
        this.columnsMenuOpen.set(false);
    }

    toggleRoleFilter(): void {
        this.roleFilterOpen.set(!this.roleFilterOpen());
    }

    closeRoleFilter(): void {
        this.roleFilterOpen.set(false);
    }

    updateRoleFilter(value: { ids: string[] }): void {
        this.roleFilterIds.set(value.ids ?? []);
    }

    toggleColumn(key: string): void {
        const current = this.visibleColumnKeys();
        if (current.includes(key)) {
            this.visibleColumnKeys.set(current.filter(item => item !== key));
            return;
        }
        this.visibleColumnKeys.set([...current, key]);
    }

    clearFilters(): void {
        this.store.setSearch('');
        this.statusFilter.set('all');
        this.schoolAccessFilter.set('any');
        this.roleFilterIds.set([]);
        this.pageIndex.set(1);
    }

    changeDensity(value: MbTableDensity): void {
        this.density.set(value);
    }

    changeRowsPerPage(value: string): void {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0) return;
        this.rowsPerPage.set(next);
        this.pageIndex.set(1);
    }

    prevPage(): void {
        const next = Math.max(1, this.pageIndex() - 1);
        this.pageIndex.set(next);
    }

    nextPage(): void {
        const next = Math.min(this.pageCount(), this.pageIndex() + 1);
        this.pageIndex.set(next);
    }

    statusLabel(status: UserStatus): string {
        if (status === 'invited') return 'Invited';
        if (status === 'suspended') return 'Suspended';
        return 'Active';
    }

    statusTone(status: UserStatus): 'neutral' | 'success' | 'warning' | 'danger' {
        if (status === 'active') return 'success';
        if (status === 'suspended') return 'warning';
        return 'neutral';
    }

    userInitials(row: DirectoryUserRow): string {
        const base = row.name || row.email || '';
        const parts = base.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'U';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    lastLoginInfo(user: UserListItem): { label: string; timestamp: number | null } {
        const raw = user.kind === 'existing' ? user.lastLogin : null;
        if (!raw) {
            return { label: 'Never', timestamp: null };
        }
        const date = new Date(raw);
        const timestamp = date.getTime();
        if (Number.isNaN(timestamp)) {
            return { label: 'Never', timestamp: null };
        }
        const now = new Date();
        const diffMs = now.getTime() - timestamp;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return { label: 'Today', timestamp };
        if (diffDays === 1) return { label: 'Yesterday', timestamp };
        if (diffDays < 7) return { label: `${diffDays} days ago`, timestamp };
        const formatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
        return { label: formatted, timestamp };
    }
}
