import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RoleService } from '../../../core/services/role.service';
import { UserService, User } from '../../../core/services/user.service';
import { Permission, Role, PermissionAction } from '../../../core/models/role.model';
import {
    MbButtonComponent,
    MbCardComponent,
    MbInputComponent,
    MbTextareaComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent,
    MbTableComponent,
    MbTableActionsDirective,
    MbFormFieldComponent,
    MbSelectComponent,
    MbCheckboxComponent,
} from '@mindbloom/ui';
import { PermissionMatrixComponent } from '../components/permission-matrix/permission-matrix.component';
import { PermissionTreeComponent } from '../components/permission-tree/permission-tree.component';
import { AccessScopePickerComponent } from '../components/access-scope-picker/access-scope-picker.component';
import { SchoolService } from '../../../core/school/school.service';

type RoleFilter = 'all' | 'system' | 'custom' | 'active';
type RoleTab = 'permissions' | 'assignments';
type RoleFormMode = 'create' | 'edit' | 'duplicate';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MbButtonComponent,
        MbCardComponent,
        MbInputComponent,
        MbTextareaComponent,
        MbModalComponent,
        MbModalFooterDirective,
        MbPopoverComponent,
        MbTableComponent,
        MbTableActionsDirective,
        MbFormFieldComponent,
        MbSelectComponent,
        MbCheckboxComponent,
        PermissionMatrixComponent,
        PermissionTreeComponent,
        AccessScopePickerComponent,
    ],
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.scss'],
})
export class RoleListComponent implements OnInit {
    trackByRole = (_: number, role: Role) => role?.id ?? _;
    trackByUser = (_: number, user: User) => user?.id ?? _;
    private readonly roleService = inject(RoleService);
    private readonly userService = inject(UserService);
    private readonly schoolService = inject(SchoolService);

    roles = this.roleService.roles;
    permissionTree = this.roleService.permissionTree;
    loading = this.roleService.loading;
    error = this.roleService.error;

    users = signal<User[]>([]);
    schools = signal<Array<{ id: string; name: string }>>([]);

    search = signal('');
    filter = signal<RoleFilter>('all');
    selectedRoleId = signal<string | null>(null);
    activeTab = signal<RoleTab>('permissions');
    roleMenuOpenId = signal<string | null>(null);
    detailRoleId = signal<string | null>(null);
    detailTab = signal<RoleTab>('permissions');
    roleRowKey = (role: Role) => role.id;
    roleTableColumns = [
        {
            key: 'name',
            label: 'Role',
            cell: (role: Role) =>
                role.description ? `${role.name}\n${role.description}` : role.name,
        },
        {
            key: 'type',
            label: 'Type',
            cell: (role: Role) => (role.isSystemRole ? 'System' : 'Custom'),
        },
        {
            key: 'scope',
            label: 'Scope',
            cell: (role: Role) => this.roleScopeLabel(role),
        },
        {
            key: 'status',
            label: 'Status',
            cell: (role: Role) => this.roleStatusLabel(role),
        },
        {
            key: 'users',
            label: 'Users',
            align: 'center' as const,
            cell: (role: Role) => String(this.roleUserCount(role.id)),
        },
    ];

    roleFormOpen = signal(false);
    roleFormMode = signal<RoleFormMode>('create');
    roleFormId = signal<string | null>(null);
    roleFormName = signal('');
    roleFormDescription = signal('');
    roleFormScopeType = signal<'workspace' | 'school'>('workspace');
    roleFormStatus = signal<'active' | 'inactive'>('active');
    roleFormPermissions = signal<string[]>([]);
    roleFormError = signal('');
    roleFormSaving = signal(false);
    roleFormDirty = signal(false);
    roleFormTemplate = signal('custom');

    deleteModalOpen = signal(false);
    deleteConfirmText = signal('');
    deleteError = signal('');
    deleteSubmitting = signal(false);
    roleToDelete = signal<Role | null>(null);

    assignmentsModalOpen = signal(false);
    assignSearch = signal('');
    assignSelections = signal<Set<string>>(new Set());
    assignError = signal('');
    assignSubmitting = signal(false);
    assignScopeType = signal<'all' | 'selected'>('all');
    assignSchoolIds = signal<string[]>([]);

    readonly filteredRoles = computed(() => {
        const term = this.search().trim().toLowerCase();
        const filter = this.filter();
        const list = this.roles().filter((role): role is Role => !!role && !!role.id);
        return list.filter((role) => {
            if (term && !role.name.toLowerCase().includes(term) && !role.description?.toLowerCase().includes(term)) {
                return false;
            }
            if (filter === 'system') {
                return role.isSystemRole;
            }
            if (filter === 'custom') {
                return !role.isSystemRole;
            }
            if (filter === 'active') {
                return (role.status || 'active') === 'active';
            }
            return true;
        });
    });

    readonly selectedRole = computed(() => {
        const roleId = this.selectedRoleId();
        const list = this.filteredRoles();
        if (!list.length) {
            return null;
        }
        return list.find((role) => role.id === roleId) || list[0];
    });

    readonly detailRole = computed(() => {
        const roleId = this.detailRoleId();
        if (!roleId) return null;
        return this.filteredRoles().find((role) => role.id === roleId) || null;
    });

    readonly roleCounts = computed(() => {
        const counts = new Map<string, number>();
        this.users().forEach((user) => {
            if (user.roleId) {
                counts.set(user.roleId, (counts.get(user.roleId) || 0) + 1);
            }
        });
        return counts;
    });

    readonly selectedRoleUsers = computed(() => {
        const role = this.selectedRole();
        if (!role) return [];
        return this.users().filter((user) => user.roleId === role.id);
    });

    readonly selectedRoleHasAdminPerms = computed(() => {
        const role = this.selectedRole();
        if (!role) return false;
        return role.permissions.some((perm) =>
            perm.resource.startsWith('system') || perm.actions?.includes(PermissionAction.MANAGE)
        );
    });

    readonly assignableUsers = computed(() => {
        const term = this.assignSearch().trim().toLowerCase();
        const role = this.selectedRole();
        return this.users().filter((user) => {
            if (role && user.roleId === role.id) {
                return false;
            }
            if (!term) return true;
            return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
        });
    });

    ngOnInit(): void {
        this.roleService.getRoles().subscribe();
        this.roleService.getPermissionTree().subscribe();
        this.loadUsers();
        this.loadSchools();
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe({
            next: (users) => this.users.set((users || []).filter((user) => !!user && !!user.id)),
            error: () => this.users.set([]),
        });
    }

    loadSchools(): void {
        this.schoolService.listSchools().subscribe({
            next: (schools) => this.schools.set(schools.map((school) => ({ id: school.id, name: school.name }))),
            error: () => this.schools.set([]),
        });
    }

    selectRole(roleId: string): void {
        this.selectedRoleId.set(roleId);
        this.activeTab.set('permissions');
    }

    setFilter(value: RoleFilter): void {
        this.filter.set(value);
        if (!this.filteredRoles().length) {
            this.selectedRoleId.set(null);
        }
    }

    roleUserCount(roleId: string): number {
        return this.roleCounts().get(roleId) || 0;
    }

    toggleRoleMenu(roleId: string, event?: MouseEvent): void {
        event?.stopPropagation();
        this.roleMenuOpenId.set(this.roleMenuOpenId() === roleId ? null : roleId);
    }

    closeRoleMenu(): void {
        this.roleMenuOpenId.set(null);
    }

    openRoleDetails(roleId: string, tab: RoleTab): void {
        this.detailRoleId.set(roleId);
        this.detailTab.set(tab);
        this.selectedRoleId.set(roleId);
    }

    closeRoleDetails(): void {
        this.detailRoleId.set(null);
    }

    isRoleDetailOpen(roleId: string): boolean {
        return this.detailRoleId() === roleId;
    }

    setDetailTab(tab: RoleTab): void {
        this.detailTab.set(tab);
    }

    roleHasAdminPerms(role: Role): boolean {
        return role.permissions.some((perm) =>
            perm.resource.startsWith('system') || perm.actions?.includes(PermissionAction.MANAGE)
        );
    }

    roleUsers(role: Role): User[] {
        return this.users().filter((user) => user.roleId === role.id);
    }

    openCreateRole(): void {
        this.roleFormMode.set('create');
        this.roleFormId.set(null);
        this.roleFormName.set('');
        this.roleFormDescription.set('');
        this.roleFormScopeType.set('workspace');
        this.roleFormStatus.set('active');
        this.roleFormPermissions.set([]);
        this.roleFormTemplate.set('custom');
        this.roleFormError.set('');
        this.roleFormDirty.set(false);
        this.roleFormOpen.set(true);
    }

    handleScopeTypeChange(value: string): void {
        if (value === 'workspace' || value === 'school') {
            this.roleFormScopeType.set(value);
            this.markRoleFormDirty();
        }
    }

    handleStatusChange(value: string): void {
        if (value === 'active' || value === 'inactive') {
            this.roleFormStatus.set(value);
            this.markRoleFormDirty();
        }
    }

    rolePermissionIds(role: Role | null): string[] {
        if (!role) return [];
        return (role.permissions || []).map((perm) => perm.id || perm.resource);
    }

    assignmentRows() {
        const role = this.selectedRole();
        return this.selectedRoleUsers().map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            scope: role ? this.roleScopeLabel(role) : 'Workspace',
            status: 'Active',
        }));
    }

    assignmentRowsForRole(role: Role) {
        return this.roleUsers(role).map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            scope: this.roleScopeLabel(role),
            status: 'Active',
        }));
    }

    openEditRole(role: Role): void {
        if (role.isSystemRole) {
            return;
        }
        this.selectedRoleId.set(role.id);
        this.roleFormMode.set('edit');
        this.roleFormId.set(role.id);
        this.roleFormName.set(role.name);
        this.roleFormDescription.set(role.description);
        this.roleFormScopeType.set(role.scopeType || 'workspace');
        this.roleFormStatus.set(role.status || 'active');
        this.roleFormPermissions.set(role.permissions.map((perm) => perm.id || perm.resource));
        this.roleFormTemplate.set('custom');
        this.roleFormError.set('');
        this.roleFormDirty.set(false);
        this.roleFormOpen.set(true);
    }

    openDuplicateRole(role: Role): void {
        this.selectedRoleId.set(role.id);
        this.roleFormMode.set('duplicate');
        this.roleFormId.set(null);
        this.roleFormName.set(`${role.name} copy`);
        this.roleFormDescription.set(role.description);
        this.roleFormScopeType.set(role.scopeType || 'workspace');
        this.roleFormStatus.set('active');
        this.roleFormPermissions.set(role.permissions.map((perm) => perm.id || perm.resource));
        this.roleFormTemplate.set('custom');
        this.roleFormError.set('');
        this.roleFormDirty.set(true);
        this.roleFormOpen.set(true);
    }

    closeRoleForm(): void {
        if (this.roleFormDirty() && !confirm('Discard changes?')) {
            return;
        }
        this.roleFormOpen.set(false);
        this.roleFormError.set('');
    }

    markRoleFormDirty(): void {
        this.roleFormDirty.set(true);
    }

    updateRolePermissions(next: string[]): void {
        this.roleFormPermissions.set(next);
        this.roleFormDirty.set(true);
    }

    applyPermissionTemplate(templateId: string): void {
        this.roleFormTemplate.set(templateId);
        if (templateId === 'custom') {
            return;
        }
        const ids = new Set<string>();
        const tree = this.permissionTree();
        const matcher = this.templateMatchers()[templateId];
        tree.forEach((group) => {
            this.flattenPermissions([group]).forEach((perm) => {
                if (matcher(perm)) {
                    ids.add(perm.id);
                }
            });
        });
        this.roleFormPermissions.set([...ids]);
        this.roleFormDirty.set(true);
    }

    saveRole(): void {
        const name = this.roleFormName().trim();
        if (!name) {
            this.roleFormError.set('Role name is required.');
            return;
        }

        const permissions = this.collectPermissionsByIds(this.permissionTree(), this.roleFormPermissions());
        if (!permissions.length) {
            this.roleFormError.set('Select at least one permission.');
            return;
        }

        this.roleFormSaving.set(true);
        this.roleFormError.set('');

        const payload = {
            name,
            description: this.roleFormDescription().trim() || 'Custom role',
            scopeType: this.roleFormScopeType(),
            status: this.roleFormStatus(),
            permissions,
        };

        const request = this.roleFormMode() === 'edit' && this.roleFormId()
            ? this.roleService.updateRole(this.roleFormId()!, payload)
            : this.roleService.createRole(payload);

        request.subscribe({
            next: (role) => {
                this.roleFormSaving.set(false);
                this.roleFormOpen.set(false);
                this.roleFormDirty.set(false);
                this.selectedRoleId.set(role.id);
            },
            error: (err) => {
                this.roleFormSaving.set(false);
                this.roleFormError.set(err.error?.message || 'Unable to save role.');
            },
        });
    }

    toggleRoleStatus(role: Role): void {
        if (role.isSystemRole) return;
        const nextStatus = (role.status || 'active') === 'active' ? 'inactive' : 'active';
        this.roleService.updateRole(role.id, { status: nextStatus }).subscribe();
    }

    requestDeleteRole(role: Role): void {
        if (role.isSystemRole) return;
        this.selectedRoleId.set(role.id);
        this.roleToDelete.set(role);
        this.deleteConfirmText.set('');
        this.deleteError.set('');
        this.deleteSubmitting.set(false);
        this.deleteModalOpen.set(true);
    }

    closeDeleteModal(): void {
        if (this.deleteSubmitting()) return;
        this.deleteModalOpen.set(false);
        this.roleToDelete.set(null);
        this.deleteConfirmText.set('');
        this.deleteError.set('');
    }

    deleteRole(): void {
        const role = this.roleToDelete();
        if (!role) return;
        if (this.deleteConfirmText().trim().toLowerCase() !== role.name.trim().toLowerCase()) {
            this.deleteError.set('Enter the role name to confirm.');
            return;
        }
        if (this.roleUserCount(role.id) > 0) {
            this.deleteError.set('Remove assigned users before deleting this role.');
            return;
        }
        this.deleteSubmitting.set(true);
        this.roleService.deleteRole(role.id).subscribe({
            next: () => {
                this.deleteSubmitting.set(false);
                this.closeDeleteModal();
            },
            error: (err) => {
                this.deleteSubmitting.set(false);
                this.deleteError.set(err.error?.message || 'Unable to delete role.');
            },
        });
    }

    openAssignmentsModal(role?: Role): void {
        if (role) {
            this.selectedRoleId.set(role.id);
        }
        this.assignSelections.set(new Set());
        this.assignSearch.set('');
        this.assignError.set('');
        this.assignSubmitting.set(false);
        this.assignScopeType.set('all');
        this.assignSchoolIds.set([]);
        this.assignmentsModalOpen.set(true);
    }

    closeAssignmentsModal(): void {
        if (this.assignSubmitting()) return;
        this.assignmentsModalOpen.set(false);
        this.assignError.set('');
    }

    toggleAssignSelection(userId: string): void {
        const next = new Set(this.assignSelections());
        if (next.has(userId)) {
            next.delete(userId);
        } else {
            next.add(userId);
        }
        this.assignSelections.set(next);
    }

    saveAssignments(): void {
        const role = this.selectedRole();
        if (!role) return;
        if (!this.assignSelections().size) {
            this.assignError.set('Select at least one user.');
            return;
        }
        if (role.scopeType === 'school' && this.assignScopeType() === 'selected' && !this.assignSchoolIds().length) {
            this.assignError.set('Select at least one school for this role.');
            return;
        }
        this.assignSubmitting.set(true);
        this.assignError.set('');
        const updates = [...this.assignSelections()].map((userId) =>
            firstValueFrom(this.userService.updateUser(userId, { roleId: role.id })),
        );

        Promise.all(updates)
            .then(() => {
                this.assignSubmitting.set(false);
                this.assignmentsModalOpen.set(false);
                this.loadUsers();
            })
            .catch((err) => {
                this.assignSubmitting.set(false);
                this.assignError.set(err?.error?.message || 'Unable to assign users.');
            });
    }

    removeAssignment(userId: string): void {
        const role = this.selectedRole();
        if (!role) return;
        this.userService.updateUser(userId, { roleId: null }).subscribe({
            next: () => this.loadUsers(),
        });
    }

    roleScopeLabel(role: Role): string {
        return (role.scopeType || 'workspace') === 'workspace' ? 'Workspace' : 'School';
    }

    roleStatusLabel(role: Role): string {
        return (role.status || 'active') === 'active' ? 'Active' : 'Inactive';
    }

    private collectPermissionsByIds(tree: Permission[], ids: string[]): Permission[] {
        const selected = new Map<string, Permission>();
        const lookup = new Set(ids);

        const walk = (perm: Permission) => {
            const key = perm.id || perm.resource;
            if (lookup.has(key)) {
                selected.set(key, perm);
            }
            perm.children?.forEach(walk);
        };

        tree.forEach(walk);
        return [...selected.values()];
    }

    private flattenPermissions(perms: Permission[]): Permission[] {
        const output: Permission[] = [];
        const walk = (perm: Permission) => {
            output.push(perm);
            perm.children?.forEach(walk);
        };
        perms.forEach(walk);
        return output;
    }

    private templateMatchers(): Record<string, (perm: Permission) => boolean> {
        return {
            teacher: (perm) => ['students', 'attendance', 'academics', 'grades', 'exams', 'timetable']
                .some((key) => perm.resource.includes(key)),
            finance: (perm) => ['fees', 'finance', 'payments', 'reports'].some((key) => perm.resource.includes(key)),
            registrar: (perm) => ['students', 'admissions', 'academics'].some((key) => perm.resource.includes(key)),
            principal: (perm) => ['students', 'attendance', 'academics', 'reports', 'finance', 'staff']
                .some((key) => perm.resource.includes(key)),
            custom: () => false,
        };
    }
}
