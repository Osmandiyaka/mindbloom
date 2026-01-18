import { Injectable, computed, signal } from '@angular/core';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { UserSerivce } from './user-serivce.service';
import { CreateUserRequest, InviteUsersRequest, mapApiUserToListItem, mapInviteEmailToPendingRow } from './user-form.mapper';
import { parseCsvUsers } from './user-input.parsers';
import { RequestState, UserListItem, UserStatus } from './users.types';

@Injectable({ providedIn: 'root' })
export class UsersStore {
    private readonly usersApi = signal<UserSerivce | null>(null);
    private readonly facade = signal<TenantWorkspaceSetupFacade | null>(null);

    users = signal<UserListItem[]>([]);
    userSearch = signal('');
    createUserState = signal<RequestState>({ status: 'idle' });
    inviteUsersState = signal<RequestState>({ status: 'idle' });
    updateUserState = signal<RequestState>({ status: 'idle' });
    statusUpdateState = signal<RequestState>({ status: 'idle' });

    filteredUsers = computed(() => {
        const query = this.userSearch().trim().toLowerCase();
        const list = this.users();
        if (!query) return list;
        return list.filter(user => {
            const name = user.kind === 'existing' ? user.name : '';
            return name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
        });
    });

    canCreateUsers = signal(true);

    connect(api: UserSerivce, facade: TenantWorkspaceSetupFacade): void {
        this.usersApi.set(api);
        this.facade.set(facade);
        const existing = facade.users();
        if (existing.length) {
            this.users.set(existing.map(user => ({
                ...user,
                kind: 'existing' as const,
            })));
        }
    }

    loadUsers(): void {
        const api = this.usersApi();
        if (!api) return;
        api.getUsers().subscribe({
            next: (users) => {
                const rows = users.map(user => mapApiUserToListItem(user));
                this.users.set(rows);
                this.syncFacade();
            },
        });
    }

    createUser(payload: CreateUserRequest): void {
        const api = this.usersApi();
        if (!api) return;
        this.createUserState.set({ status: 'loading' });
        api.createUser(payload).subscribe({
            next: (user) => {
                this.users.update(items => [...items, mapApiUserToListItem(user)]);
                this.createUserState.set({ status: 'success' });
                this.syncFacade();
            },
            error: (err) => {
                this.createUserState.set({ status: 'error', error: err?.message || 'Failed to create user' });
            },
        });
    }

    inviteUsers(payload: InviteUsersRequest): void {
        const api = this.usersApi();
        if (!api) return;
        this.inviteUsersState.set({ status: 'loading' });
        api.inviteUsers(payload).subscribe({
            next: (users) => {
                const created = users.map(user => mapApiUserToListItem(user));
                const pending = payload.emails
                    .filter(email => !users.some(user => user.email.toLowerCase() === email.toLowerCase()))
                    .map(email => mapInviteEmailToPendingRow(email, payload.roleIds ?? [], payload.schoolAccess));
                this.users.update(items => [...items, ...created, ...pending]);
                this.inviteUsersState.set({ status: 'success' });
                this.syncFacade();
            },
            error: (err) => {
                this.inviteUsersState.set({ status: 'error', error: err?.message || 'Failed to send invites' });
            },
        });
    }

    updateUser(userId: string, payload: Partial<CreateUserRequest>): void {
        const api = this.usersApi();
        if (!api) return;
        this.updateUserState.set({ status: 'loading' });
        api.updateUser(userId, payload).subscribe({
            next: (user) => {
                this.users.update(items => items.map(item => {
                    if (item.kind !== 'existing' || item.id !== userId) return item;
                    return mapApiUserToListItem(user);
                }));
                this.updateUserState.set({ status: 'success' });
                this.syncFacade();
            },
            error: (err) => {
                this.updateUserState.set({ status: 'error', error: err?.message || 'Failed to update user' });
            },
        });
    }

    toggleUserStatus(userId: string, nextStatus: UserStatus): void {
        const api = this.usersApi();
        if (!api) return;
        this.statusUpdateState.set({ status: 'loading' });
        const request = nextStatus === 'suspended' ? api.suspendUser(userId) : api.activateUser(userId);
        request.subscribe({
            next: (user) => {
                this.users.update(items => items.map(item => {
                    if (item.kind !== 'existing' || item.id !== userId) return item;
                    return mapApiUserToListItem(user);
                }));
                this.statusUpdateState.set({ status: 'success' });
                this.syncFacade();
            },
            error: (err) => {
                this.statusUpdateState.set({ status: 'error', error: err?.message || 'Failed to update status' });
            },
        });
    }

    removeUser(userId: string): void {
        this.users.update(items => items.filter(item => item.id !== userId));
        this.syncFacade();
    }

    importCsvUsers(text: string): void {
        const rows = parseCsvUsers(text);
        if (!rows.length) return;
        const pending = rows.map(row => ({
            kind: 'pendingInvite' as const,
            id: crypto.randomUUID(),
            email: row.email,
            roleId: null,
            roleName: row.roleName ?? null,
            roleIds: [],
            status: 'invited' as const,
            schoolAccess: { scope: 'all' as const },
            createdAt: new Date().toISOString(),
        }));
        this.users.update(items => [...items, ...pending]);
        this.syncFacade();
    }

    setSearch(value: string): void {
        this.userSearch.set(value);
    }

    private syncFacade(): void {
        const facade = this.facade();
        if (!facade) return;
        const existing = this.users().filter(item => item.kind === 'existing') as any;
        facade.users.set(existing);
    }
}
