import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
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
    type MbTableColumn,
    MbTableActionsDirective,
    MbFormFieldComponent,
    MbSelectComponent,
    MbCheckboxComponent,
} from '@mindbloom/ui';
import { PermissionMatrixComponent } from '../components/permission-matrix/permission-matrix.component';
import { PermissionTreeComponent } from '../components/permission-tree/permission-tree.component';
import { AccessScopePickerComponent } from '../components/access-scope-picker/access-scope-picker.component';
import { SchoolService } from '../../../core/school/school.service';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';

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
        SearchInputComponent,
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
    orgUnits = signal<Array<{ id: string; name: string }>>([]);

    search = signal('');
    filters = signal<Set<RoleFilter>>(new Set(['all']));
    selectedRoleId = signal<string | null>(null);
    roleMenuOpenId = signal<string | null>(null);
    detailRoleId = signal<string | null>(null);
    detailTab = signal<RoleTab>('permissions');
    roleRowKey = (role: Role) => role.id;
    roleRowClass = (role: Role) => (this.detailRoleId() === role.id ? 'roles-row--selected' : '');
    detailMenuOpen = signal(false);
    roleTableColumns: MbTableColumn<Role>[] = [
        {
            key: 'name',
            label: 'Role',
            cell: (role: Role) => {
                const badges = [
                    { label: this.roleCategoryLabel(role), tone: 'neutral' as const },
                    {
                        label: role.isSystemRole ? 'System' : 'Custom',
                        tone: (role.isSystemRole ? 'success' : 'neutral') as 'success' | 'neutral',
                    },
                ];
                if ((role.scopeType || 'workspace') === 'school') {
                    badges.push({ label: 'School', tone: 'neutral' as const });
                }
                return {
                    primary: role.name,
                    secondary: role.description || undefined,
                    badges,
                    icon: this.roleHasAdminPerms(role)
                        ? { symbol: '⚠', title: 'High privilege' }
                        : undefined,
                };
            },
        },
        {
            key: 'status',
            label: 'Status',
            cell: (role: Role) => this.roleStatusLabel(role),
        },
    ];

    roleFormOpen = signal(false);
    roleFormMode = signal<RoleFormMode>('create');
    roleFormId = signal<string | null>(null);
    roleFormName = signal('');
    roleFormDescription = signal('');
    roleFormScopeType = signal<'workspace' | 'school' | 'org'>('workspace');
    roleFormSchoolIds = signal<Set<string>>(new Set());
    roleFormOrgUnitIds = signal<Set<string>>(new Set());
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
        const filters = this.filters();
        const list = this.roles().filter((role): role is Role => !!role && !!role.id);
        return list.filter((role) => {
            if (term && !role.name.toLowerCase().includes(term) && !role.description?.toLowerCase().includes(term)) {
                return false;
            }
            if (!filters.size || filters.has('all')) {
                return true;
            }
            if (filters.has('system') && !role.isSystemRole) {
                return false;
            }
            if (filters.has('custom') && role.isSystemRole) {
                return false;
            }
            if (filters.has('active') && (role.status || 'active') !== 'active') {
                return false;
            }
            return true;
        });
    });

    readonly activeFilterCount = computed(() => {
        const filters = this.filters();
        if (!filters.size || filters.has('all')) {
            return 0;
        }
        return filters.size;
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

    private readonly defaultSelectionEffect = effect(() => {
        if (this.detailRoleId()) {
            return;
        }
        const list = this.filteredRoles();
        if (list.length) {
            this.detailRoleId.set(list[0].id);
            this.detailTab.set('permissions');
        }
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


    setFilter(value: RoleFilter): void {
        const next = new Set(this.filters());
        if (value === 'all') {
            next.clear();
            next.add('all');
        } else {
            next.delete('all');
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            if (!next.size) {
                next.add('all');
            }
        }
        this.filters.set(next);
        if (!this.filteredRoles().length) {
            this.selectedRoleId.set(null);
        }
    }

    clearFilters(): void {
        this.filters.set(new Set(['all']));
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

    toggleDetailMenu(): void {
        this.detailMenuOpen.set(!this.detailMenuOpen());
    }

    closeDetailMenu(): void {
        this.detailMenuOpen.set(false);
    }

    exportRole(role: Role): void {
        const payload = {
            id: role.id,
            name: role.name,
            description: role.description,
            isSystemRole: role.isSystemRole,
            scopeType: role.scopeType || 'workspace',
            status: role.status || 'active',
            permissions: role.permissions,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${role.name.replace(/\s+/g, '-').toLowerCase()}-role.json`;
        link.click();
        URL.revokeObjectURL(url);
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

    toggleRoleFormSchool(id: string): void {
        const next = new Set(this.roleFormSchoolIds());
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.roleFormSchoolIds.set(next);
        this.markRoleFormDirty();
    }

    toggleRoleFormOrgUnit(id: string): void {
        const next = new Set(this.roleFormOrgUnitIds());
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.roleFormOrgUnitIds.set(next);
        this.markRoleFormDirty();
    }

    roleCategoryLabel(role: Role): string {
        const resources = role.permissions.map((perm) => perm.resource);
        if (resources.some((resource) => resource.startsWith('system') || resource.startsWith('admin'))) {
            return 'Admin';
        }
        if (resources.some((resource) => resource.startsWith('academics') || resource.startsWith('students'))) {
            return 'Academic';
        }
        if (resources.some((resource) => resource.startsWith('fees') || resource.startsWith('finance') || resource.startsWith('hr'))) {
            return 'Operational';
        }
        return 'External';
    }


    openCreateRole(): void {
        this.roleFormMode.set('create');
        this.roleFormId.set(null);
        this.roleFormName.set('');
        this.roleFormDescription.set('');
        this.roleFormScopeType.set('workspace');
        this.roleFormSchoolIds.set(new Set());
        this.roleFormOrgUnitIds.set(new Set());
        this.roleFormStatus.set('active');
        this.roleFormPermissions.set([]);
        this.roleFormTemplate.set('custom');
        this.roleFormError.set('');
        this.roleFormDirty.set(false);
        this.roleFormOpen.set(true);
    }

    handleScopeTypeChange(value: string): void {
        if (value === 'workspace' || value === 'school' || value === 'org') {
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
        this.roleFormSchoolIds.set(new Set(role.schoolIds || []));
        this.roleFormOrgUnitIds.set(new Set(role.orgUnitIds || []));
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
        this.roleFormSchoolIds.set(new Set(role.schoolIds || []));
        this.roleFormOrgUnitIds.set(new Set(role.orgUnitIds || []));
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
            schoolIds:
                this.roleFormScopeType() === 'school' ? Array.from(this.roleFormSchoolIds()) : undefined,
            orgUnitIds:
                this.roleFormScopeType() === 'org' ? Array.from(this.roleFormOrgUnitIds()) : undefined,
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
        const scope = role.scopeType || 'workspace';
        if (scope === 'workspace') return 'Workspace';
        if (scope === 'school') return 'School';
        return 'Organizational units';
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
            principal: (perm) => ['students', 'attendance', 'academics', 'reports', 'finance', 'staff']
                .some((key) => perm.resource.includes(key)),
            admin: () => true,
            custom: () => false,
        };
    }
}
