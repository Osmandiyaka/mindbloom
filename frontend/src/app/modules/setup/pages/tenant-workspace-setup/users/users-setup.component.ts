import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MbTableColumn } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { CreateUserModalComponent } from './create-user-modal.component';
import { EditUserModalComponent } from './edit-user-modal.component';
import { InviteUsersModalComponent } from './invite-users-modal.component';
import { ViewUserDrawerComponent } from './view-user-drawer.component';
import { UsersStore } from './users.store';
import { CreateUserFormState, EditUserFormState, ExistingUserRow, InviteUsersFormState, UserListItem } from './users.types';
import { mapCreateUserFormToApiPayload, mapInviteUsersFormToApiPayload } from './user-form.mapper';
import { UserSerivce } from './user-serivce.service';

@Component({
    selector: 'app-tenant-users',
    standalone: true,
    imports: [
        ...TENANT_WORKSPACE_SETUP_IMPORTS,
        CreateUserModalComponent,
        InviteUsersModalComponent,
        EditUserModalComponent,
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

    userMenuOpenId = signal<string | null>(null);
    usersStepSkipped = signal(false);
    isInviteModalOpen = signal(false);
    isCreateUserModalOpen = signal(false);
    isEditUserModalOpen = signal(false);
    isViewUserModalOpen = signal(false);
    isDeleteConfirmOpen = signal(false);
    selectedUser = signal<ExistingUserRow | null>(null);
    editPayload = signal<EditUserFormState | null>(null);
    deleteTarget = signal<UserListItem | null>(null);

    readonly existingEmails = computed(() =>
        this.store.users()
            .filter(item => item.kind === 'existing')
            .map(item => item.email)
    );

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

    readonly userTableColumns: MbTableColumn<UserListItem>[] = [
        {
            key: 'name',
            label: 'Name',
            cell: row => row.kind === 'existing' ? row.name : 'Pending invite'
        },
        {
            key: 'email',
            label: 'Email',
            cell: row => row.email
        },
        {
            key: 'role',
            label: 'Role',
            cell: row => row.roleName || '—'
        },
        {
            key: 'schoolAccess',
            label: 'School access',
            cell: row => this.schoolAccessLabel(row)
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    readonly canContinueUsersStep = computed(() =>
        this.store.users().some(item => item.kind === 'existing') || this.usersStepSkipped()
    );

    ngOnInit(): void {
        this.store.connect(this.usersApi, this.setup);
        this.store.loadUsers();
        this.usersStepSkipped.set(this.setup.usersStepSkipped());
    }

    handleUserCellClick(event: { row: UserListItem; column: MbTableColumn<UserListItem> }): void {
        if (event.column.key !== 'name') return;
        if (event.row.kind !== 'existing') return;
        this.openViewUser(event.row);
    }

    toggleUserMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.userMenuOpenId() === id ? null : id;
        this.userMenuOpenId.set(next);
    }

    userMenuKey(row: UserListItem): string {
        return row.id;
    }

    closeUserMenu(): void {
        this.userMenuOpenId.set(null);
    }

    trackUserRow = (_: number, user: UserListItem) => user.id;

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
    }

    openEditUser(user: ExistingUserRow): void {
        this.editPayload.set({
            id: user.id,
            name: user.name,
            roleId: user.roleId,
            roleName: user.roleName,
            schoolAccessScope: user.schoolAccess.scope,
            selectedSchoolIds: user.schoolAccess.scope === 'selected' ? user.schoolAccess.schoolIds : [],
            jobTitle: user.jobTitle || '',
            department: user.department || '',
        });
        this.isEditUserModalOpen.set(true);
    }

    closeEditUser(): void {
        this.isEditUserModalOpen.set(false);
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
        const payload = mapCreateUserFormToApiPayload(form);
        this.store.createUser(payload);
        this.closeCreateUserModal();
    }

    handleInviteSubmitted(form: InviteUsersFormState): void {
        const payload = mapInviteUsersFormToApiPayload(form);
        this.store.inviteUsers(payload);
        this.closeInviteModal();
    }

    handleEditSubmitted(form: EditUserFormState): void {
        this.store.updateUser(form.id, {
            name: form.name,
            roleIds: form.roleId ? [form.roleId] : [],
            schoolAccess: form.schoolAccessScope === 'selected'
                ? { scope: 'selected', schoolIds: form.selectedSchoolIds }
                : { scope: 'all' },
            jobTitle: form.jobTitle || undefined,
            department: form.department || undefined,
        });
        this.closeEditUser();
    }

    resendInvite(row: UserListItem): void {
        if (row.kind !== 'existing') return;
        this.store.updateUser(row.id, {});
    }

    toggleUserStatus(row: UserListItem): void {
        if (row.kind !== 'existing') return;
        const nextStatus = row.status === 'suspended' ? 'active' : 'suspended';
        this.store.toggleUserStatus(row.id, nextStatus);
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
}
