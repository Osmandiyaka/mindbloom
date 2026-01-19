import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from '../../../../../core/ui/toast/toast.service';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { OrgUnit, OrgUnitNode, OrgUnitRole, OrgUnitStatus, OrgUnitType } from '../tenant-workspace-setup.models';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { OrgUnitStore } from './org-unit.store';
import { UserSerivce } from '../users/user-serivce.service';
import { mapApiUserToUserRow } from '../users/user-form.mapper';

@Component({
    selector: 'app-tenant-workspace-setup-org-units',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './org-units.component.html',
    styleUrls: ['./org-units.component.scss']
})
export class TenantWorkspaceSetupOrgUnitsComponent {
    readonly vm = this;
    private readonly setup = inject(TenantWorkspaceSetupFacade);
    private readonly toast = inject(ToastService);
    private readonly orgUnitStore = inject(OrgUnitStore);
    private readonly usersApi = inject(UserSerivce);

    readonly users = this.setup.users;
    readonly orgUnits = computed(() => this.orgUnitStore.tree().map(unit => this.mapOrgUnit(unit)));

    activeOrgUnitId = this.orgUnitStore.selectedOrgUnitId;
    expandedOrgUnitIds = signal<string[]>([]);
    activeOrgUnitTab = signal<'members' | 'roles'>('members');
    orgUnitMemberSearch = signal('');
    orgUnitRoleSearch = signal('');
    orgUnitFormOpen = signal(false);
    orgUnitFormName = signal('');
    orgUnitFormType = signal<OrgUnitType>('Department');
    orgUnitFormStatus = signal<OrgUnitStatus>('Active');
    orgUnitFormParentId = signal<string | null>(null);
    orgUnitFormError = signal('');
    orgUnitFormSubmitting = signal(false);
    assignMembersOpen = signal(false);
    assignMemberIds = signal<string[]>([]);
    assignMemberSelection = signal<string | null>(null);
    assignRolesOpen = signal(false);
    assignRoleIds = signal<string[]>([]);
    assignRoleDraft = signal<OrgUnitRole[]>([]);
    isOrgUnitDeleteOpen = signal(false);
    orgUnitDeleteTarget = signal<OrgUnit | null>(null);
    orgUnitDeleteImpact = this.orgUnitStore.deleteImpact;
    orgUnitDeleteImpactLoading = this.orgUnitStore.deleteImpactLoading;
    orgUnitDeleteConfirm = signal('');
    orgUnitDeleteError = this.orgUnitStore.deleteError;
    orgUnitDeleteSubmitting = signal(false);
    isOrgUnitRenameOpen = signal(false);
    orgUnitRenameName = signal('');
    orgUnitRenameError = signal('');
    orgUnitRenameSubmitting = signal(false);
    isOrgUnitMoveOpen = signal(false);
    isOrgUnitChangeParentOpen = signal(false);
    orgUnitMoveTarget = signal<OrgUnit | null>(null);
    orgUnitMoveParentId = signal<string | null>(null);
    orgUnitMoveError = signal('');
    orgUnitMoveSubmitting = signal(false);
    isOrgUnitDeactivateOpen = signal(false);
    orgUnitDeactivateError = signal('');
    orgUnitDeactivateSubmitting = signal(false);
    ouActionsMenuOpen = signal(false);

    readonly orgUnitTypes: OrgUnitType[] = [
        'District',
        'School',
        'Division',
        'Department',
        'Grade',
        'Section',
        'Custom'
    ];

    readonly orgUnitTree = computed(() => this.buildOrgUnitTree(this.orgUnits()));
    readonly selectedOrgUnit = computed(() => {
        const activeId = this.activeOrgUnitId();
        return activeId ? this.orgUnits().find(unit => unit.id === activeId) || null : null;
    });
    readonly selectedOrgUnitPath = computed(() => this.buildOrgUnitPath(this.activeOrgUnitId()));
    readonly selectedOrgUnitMembers = computed(() => {
        if (!this.activeOrgUnitId()) return [];
        const members = this.orgUnitStore.members();
        const search = this.orgUnitMemberSearch().trim().toLowerCase();
        if (!search) return members;
        return members.filter(member => {
            const haystack = `${member.name} ${member.email}`.toLowerCase();
            return haystack.includes(search);
        });
    });
    readonly selectedOrgUnitMemberCount = computed(() => {
        return this.orgUnitStore.selectedCounts().membersCount;
    });
    readonly staffSelectorOptions = computed(() => this.users()
        .map(user => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.roleName || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)));
    readonly assignMemberRows = computed(() => {
        const users = new Map(this.users().map(user => [user.id, user]));
        return this.assignMemberIds().map(id => {
            const user = users.get(id);
            return {
                id,
                name: user?.name || user?.email || id,
                email: user?.email || '',
            };
        });
    });
    readonly selectedOrgUnitRoles = computed(() => {
        if (!this.activeOrgUnitId()) return [];
        const roles = this.orgUnitStore.roles().map(role => this.mapOrgUnitRole(role));
        const search = this.orgUnitRoleSearch().trim().toLowerCase();
        if (!search) return roles;
        return roles.filter(role => {
            const haystack = [role.name, role.description].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    });
    readonly selectedOrgUnitRoleCount = computed(() => {
        return this.orgUnitStore.selectedCounts().rolesCount;
    });
    readonly orgUnitDeleteRequiresConfirm = computed(() => {
        const impact = this.orgUnitDeleteImpact();
        return !!impact && (
            impact.descendantUnitsCount > 0 ||
            impact.membersDirectCount > 0 ||
            impact.roleAssignmentsCount > 0
        );
    });

    trackOrgUnit = (_: number, node: OrgUnitNode) => node.id;
    trackOrgUnitRole = (_: number, role: OrgUnitRole) => role.id;
    trackUserRow = (_: number, user: { id?: string; userId?: string }) => user.id ?? user.userId ?? '';
    trackAssignMember = (_: number, member: { id: string }) => member.id;

    ngOnInit(): void {
        this.orgUnitStore.loadTree();
        this.loadAssignableUsers();
    }

    startAddRootUnit(): void {
        this.orgUnitFormParentId.set(null);
        this.openOrgUnitForm();
    }

    startAddChildUnit(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) {
            this.orgUnitFormParentId.set(null);
            this.openOrgUnitForm();
            this.orgUnitFormError.set('Select a parent unit before creating a child.');
            return;
        }
        this.orgUnitFormParentId.set(activeId);
        this.openOrgUnitForm();
    }

    openOrgUnitForm(): void {
        this.orgUnitFormName.set('');
        this.orgUnitFormType.set('Department');
        this.orgUnitFormStatus.set('Active');
        this.orgUnitFormError.set('');
        this.orgUnitFormOpen.set(true);
    }

    cancelOrgUnitForm(): void {
        this.orgUnitFormOpen.set(false);
        this.orgUnitFormError.set('');
        this.orgUnitFormSubmitting.set(false);
        this.orgUnitFormParentId.set(null);
    }

    requestCloseOrgUnitForm(): void {
        if (!this.orgUnitFormOpen()) return;
        if (this.isOrgUnitFormDirty() && !window.confirm('Discard this organizational unit?')) {
            return;
        }
        this.cancelOrgUnitForm();
    }

    setOrgUnitFormType(value: string): void {
        if (this.orgUnitTypes.includes(value as OrgUnitType)) {
            this.orgUnitFormType.set(value as OrgUnitType);
        }
    }

    saveOrgUnitForm(): void {
        if (this.orgUnitFormSubmitting()) return;
        const name = this.orgUnitFormName().trim();
        if (!name) {
            this.orgUnitFormError.set('Unit name is required.');
            return;
        }
        this.orgUnitFormError.set('');
        this.orgUnitFormSubmitting.set(true);
        this.orgUnitStore.createUnit(
            {
                name,
                type: this.mapTypeToApi(this.orgUnitFormType()),
                status: this.mapStatusToApi(this.orgUnitFormStatus()),
                parentId: this.orgUnitFormParentId() || undefined,
            },
            () => {
                const parentId = this.orgUnitFormParentId();
                if (parentId) {
                    this.expandedOrgUnitIds.update(items => items.includes(parentId)
                        ? items
                        : [...items, parentId]);
                }
                this.cancelOrgUnitForm();
            },
            (error) => {
                this.orgUnitFormError.set(error?.message || 'Unable to create unit.');
                this.orgUnitFormSubmitting.set(false);
            },
        );
    }

    openDeleteOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitDeleteTarget.set(target);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set(null);
        this.orgUnitDeleteImpact.set(null);
        this.orgUnitDeleteSubmitting.set(false);
        this.isOrgUnitDeleteOpen.set(true);
        this.orgUnitStore.loadDeleteImpact();
    }

    toggleOuActionsMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.ouActionsMenuOpen();
        this.ouActionsMenuOpen.set(next);
    }

    closeOuActionsMenu(): void {
        this.ouActionsMenuOpen.set(false);
    }

    requestCloseDeleteOrgUnit(): void {
        if (this.orgUnitDeleteSubmitting()) return;
        this.isOrgUnitDeleteOpen.set(false);
        this.orgUnitDeleteTarget.set(null);
        this.orgUnitDeleteImpact.set(null);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set(null);
        this.orgUnitDeleteSubmitting.set(false);
    }

    openRenameOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitRenameName.set(target.name);
        this.orgUnitRenameError.set('');
        this.orgUnitRenameSubmitting.set(false);
        this.isOrgUnitRenameOpen.set(true);
    }

    requestCloseRenameOrgUnit(): void {
        if (this.orgUnitRenameSubmitting()) return;
        this.isOrgUnitRenameOpen.set(false);
        this.orgUnitRenameError.set('');
    }

    saveRenameOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || this.orgUnitRenameSubmitting()) return;
        const nextName = this.orgUnitRenameName().trim();
        if (!nextName) {
            this.orgUnitRenameError.set('Unit name is required.');
            return;
        }
        if (nextName === target.name) {
            this.requestCloseRenameOrgUnit();
            return;
        }
        this.orgUnitRenameSubmitting.set(true);
        this.orgUnitStore.updateUnit(
            { name: nextName },
            () => {
                this.toast.success(`Organizational unit renamed to "${nextName}".`);
                this.requestCloseRenameOrgUnit();
            },
            (error) => {
                this.orgUnitRenameError.set(error?.message || 'Unable to rename unit.');
                this.orgUnitRenameSubmitting.set(false);
            }
        );
    }

    openMoveOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitMoveTarget.set(target);
        this.orgUnitMoveParentId.set(target.parentId ?? null);
        this.orgUnitMoveError.set('');
        this.orgUnitMoveSubmitting.set(false);
        this.isOrgUnitMoveOpen.set(true);
    }

    requestCloseMoveOrgUnit(): void {
        if (this.orgUnitMoveSubmitting()) return;
        this.isOrgUnitMoveOpen.set(false);
        this.orgUnitMoveTarget.set(null);
        this.orgUnitMoveParentId.set(null);
        this.orgUnitMoveError.set('');
    }

    openChangeParentOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitMoveTarget.set(target);
        this.orgUnitMoveParentId.set(target.parentId ?? null);
        this.orgUnitMoveError.set('');
        this.orgUnitMoveSubmitting.set(false);
        this.isOrgUnitChangeParentOpen.set(true);
    }

    requestCloseChangeParentOrgUnit(): void {
        if (this.orgUnitMoveSubmitting()) return;
        this.isOrgUnitChangeParentOpen.set(false);
        this.orgUnitMoveTarget.set(null);
        this.orgUnitMoveParentId.set(null);
        this.orgUnitMoveError.set('');
    }

    setOrgUnitMoveParent(value: string): void {
        this.orgUnitMoveParentId.set(value ? value : null);
    }

    saveMoveOrgUnit(): void {
        this.commitOrgUnitParentChange('moved');
    }

    saveChangeParentOrgUnit(): void {
        this.commitOrgUnitParentChange('updated');
    }

    orgUnitParentOptions(): Array<{ id: string | null; label: string }> {
        const target = this.orgUnitMoveTarget();
        if (!target) return [{ id: null, label: 'Organization (root)' }];
        const excluded = new Set(this.collectOrgUnitDescendantIds(target.id));
        excluded.add(target.id);
        const options = this.orgUnits()
            .filter(unit => !excluded.has(unit.id))
            .map(unit => ({
                id: unit.id,
                label: this.buildOrgUnitPath(unit.id)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        return [{ id: null, label: 'Organization (root)' }, ...options];
    }

    canDeactivateSelectedOrgUnit(): boolean {
        const target = this.selectedOrgUnit();
        return !!target && target.status === 'Active';
    }

    openDeactivateOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || target.status !== 'Active') return;
        this.orgUnitDeactivateError.set('');
        this.orgUnitDeactivateSubmitting.set(false);
        this.isOrgUnitDeactivateOpen.set(true);
    }

    requestCloseDeactivateOrgUnit(): void {
        if (this.orgUnitDeactivateSubmitting()) return;
        this.isOrgUnitDeactivateOpen.set(false);
        this.orgUnitDeactivateError.set('');
    }

    deactivateSelectedOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || target.status !== 'Active' || this.orgUnitDeactivateSubmitting()) return;
        this.orgUnitDeactivateSubmitting.set(true);
        this.orgUnitStore.updateUnit(
            { status: this.mapStatusToApi('Inactive') },
            () => {
                this.toast.success(`Organizational unit "${target.name}" deactivated.`);
                this.requestCloseDeactivateOrgUnit();
            },
            (error) => {
                this.orgUnitDeactivateError.set(error?.message || 'Unable to deactivate unit.');
                this.orgUnitDeactivateSubmitting.set(false);
            }
        );
    }

    canDeleteSelectedOrgUnit(): boolean {
        return !!this.selectedOrgUnit() && this.canDeleteOrgUnit() && !this.isOrgUnitDeleteLocked();
    }

    deleteSelectedOrgUnit(): void {
        const target = this.orgUnitDeleteTarget();
        if (!target || this.orgUnitDeleteSubmitting()) return;
        if (this.orgUnitDeleteRequiresConfirm() && !this.isOrgUnitDeleteConfirmValid()) return;
        this.orgUnitDeleteSubmitting.set(true);
        this.orgUnitStore.deleteUnit(
            this.orgUnitDeleteConfirm().trim(),
            () => {
                this.expandedOrgUnitIds.update(items => items.filter(id => id !== target.id));
                this.toast.success(`Organizational unit "${target.name}" and its child units were deleted.`);
                this.requestCloseDeleteOrgUnit();
            },
            (error) => {
                this.orgUnitDeleteError.set(error);
                this.orgUnitDeleteSubmitting.set(false);
            }
        );
    }

    isOrgUnitDeleteConfirmValid(): boolean {
        const target = this.orgUnitDeleteTarget();
        if (!target) return false;
        return this.orgUnitDeleteConfirm().trim().toLowerCase() === target.name.trim().toLowerCase();
    }

    getOrgUnitDeleteDisabledReason(): string | null {
        if (!this.selectedOrgUnit()) return 'Select a unit to manage actions.';
        if (this.isOrgUnitDeleteLocked()) return 'This unit can’t be deleted.';
        if (!this.canDeleteOrgUnit()) return 'Insufficient permissions.';
        return null;
    }

    isOrgUnitFormDirty(): boolean {
        return (
            this.orgUnitFormName().trim().length > 0 ||
            this.orgUnitFormType() !== 'Department' ||
            this.orgUnitFormStatus() !== 'Active'
        );
    }

    selectOrgUnit(id: string): void {
        this.orgUnitStore.selectOrgUnit(id);
        this.orgUnitMemberSearch.set('');
        this.assignMembersOpen.set(false);
        this.assignMemberIds.set([]);
    }

    toggleOrgUnitExpanded(id: string): void {
        this.expandedOrgUnitIds.update(items => items.includes(id)
            ? items.filter(item => item !== id)
            : [...items, id]);
    }

    isOrgUnitExpanded(id: string): boolean {
        return this.expandedOrgUnitIds().includes(id);
    }

    setOrgUnitTab(tab: 'members' | 'roles'): void {
        this.activeOrgUnitTab.set(tab);
        if (tab === 'roles') {
            this.assignMembersOpen.set(false);
        }
    }

    openAssignMembers(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.assignMemberIds.set(this.orgUnitStore.members().map(member => member.userId));
        this.assignMemberSelection.set(null);
        this.assignMembersOpen.set(true);
    }

    cancelAssignMembers(): void {
        this.assignMembersOpen.set(false);
    }

    addAssignMember(userId: string | null): void {
        if (!userId) return;
        this.assignMemberIds.update(ids => {
            return ids.includes(userId) ? ids : [...ids, userId];
        });
        this.assignMemberSelection.set(null);
    }

    removeAssignMember(userId: string): void {
        this.assignMemberIds.update(ids => ids.filter(id => id !== userId));
    }

    saveAssignMembers(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const memberIds = this.assignMemberIds();
        const currentIds = new Set(this.orgUnitStore.members().map(member => member.userId));
        const nextIds = new Set(memberIds);
        const toAdd = memberIds.filter(id => !currentIds.has(id));
        const toRemove = Array.from(currentIds).filter(id => !nextIds.has(id));
        if (toAdd.length) {
            this.orgUnitStore.addMembers(
                toAdd,
                () => {
                    toRemove.forEach(id => this.orgUnitStore.removeMember(id));
                    this.assignMembersOpen.set(false);
                },
                (error) => {
                    this.toast.error(error?.message || 'Unable to assign members.');
                }
            );
            return;
        }
        toRemove.forEach(id => this.orgUnitStore.removeMember(id));
        this.assignMembersOpen.set(false);
    }

    removeMemberFromOrgUnit(user: { userId: string; name?: string; email?: string }): void {
        this.orgUnitStore.removeMember(user.userId);
    }

    confirmRemoveMemberFromOrgUnit(user: { userId: string; name?: string; email?: string }): void {
        const label = user.name || user.email || 'this member';
        if (!window.confirm(`Remove ${label} from this unit?`)) return;
        this.removeMemberFromOrgUnit(user);
    }

    back(): void {
        this.setup.back();
    }

    next(): void {
        this.setup.next();
    }

    skipSetup(): void {
        this.setup.skipSetup();
    }

    openAssignRoles(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const currentRoles = this.orgUnitStore.roles().map(role => this.mapOrgUnitRole(role));
        this.assignRoleIds.set(currentRoles.map(role => role.id));
        this.assignRoleDraft.set(currentRoles);
        this.assignRolesOpen.set(true);
    }

    cancelAssignRoles(): void {
        this.assignRolesOpen.set(false);
        this.assignRoleDraft.set([]);
    }

    handleAssignRoleChange(event: { ids: string[]; roles?: OrgUnitRole[] }): void {
        this.assignRoleIds.set(event.ids);
        if (event.roles && event.roles.length) {
            const normalized = event.roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description
            }));
            this.assignRoleDraft.set(normalized);
            return;
        }
        const fallback = new Map(this.assignRoleDraft().map(role => [role.id, role]));
        const next = event.ids.map(id => fallback.get(id) ?? { id, name: id });
        this.assignRoleDraft.set(next);
    }

    saveAssignRoles(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const roleIds = this.assignRoleIds();
        this.orgUnitStore.assignRoles(
            roleIds,
            'inheritsDown',
            () => {
                this.assignRolesOpen.set(false);
            },
            (error) => {
                this.toast.error(error?.message || 'Unable to assign roles.');
            }
        );
    }

    removeRoleFromOrgUnit(role: OrgUnitRole): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitStore.removeRole(role.id);
    }

    private commitOrgUnitParentChange(action: 'moved' | 'updated'): void {
        const target = this.orgUnitMoveTarget();
        if (!target || this.orgUnitMoveSubmitting()) return;
        const nextParentId = this.orgUnitMoveParentId();
        this.orgUnitMoveError.set(`Changing parent units is not supported yet. (${action})`);
    }

    private closeOrgUnitMoveModal(): void {
        this.orgUnitMoveSubmitting.set(false);
        if (this.isOrgUnitMoveOpen()) {
            this.requestCloseMoveOrgUnit();
            return;
        }
        this.requestCloseChangeParentOrgUnit();
    }

    private isOrgUnitParentAllowed(targetId: string, parentId: string | null): boolean {
        if (!parentId) return true;
        if (parentId === targetId) return false;
        const descendants = new Set(this.collectOrgUnitDescendantIds(targetId));
        return !descendants.has(parentId);
    }

    private isOrgUnitDeleteLocked(): boolean {
        return false;
    }

    private canDeleteOrgUnit(): boolean {
        return true;
    }

    private collectOrgUnitDescendantIds(id: string): string[] {
        const byParent = new Map<string, string[]>();
        this.orgUnits().forEach(unit => {
            if (!unit.parentId) return;
            const list = byParent.get(unit.parentId) ?? [];
            list.push(unit.id);
            byParent.set(unit.parentId, list);
        });
        const collected: string[] = [];
        const stack = [...(byParent.get(id) ?? [])];
        while (stack.length) {
            const next = stack.pop()!;
            collected.push(next);
            const children = byParent.get(next);
            if (children?.length) {
                stack.push(...children);
            }
        }
        return collected;
    }

    private buildOrgUnitTree(units: OrgUnit[]): OrgUnitNode[] {
        const nodes = new Map(units.map(unit => [unit.id, { ...unit, children: [] as OrgUnitNode[] }]));
        const roots: OrgUnitNode[] = [];
        nodes.forEach(node => {
            if (node.parentId && nodes.has(node.parentId)) {
                nodes.get(node.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });
        const sortTree = (list: OrgUnitNode[]) => {
            list.sort((a, b) => a.name.localeCompare(b.name));
            list.forEach(child => sortTree(child.children));
        };
        sortTree(roots);
        return roots;
    }

    private buildOrgUnitPath(id: string | null): string {
        if (!id) return 'Organization';
        const nodes = new Map(this.orgUnits().map(unit => [unit.id, unit]));
        const path: string[] = [];
        let current = nodes.get(id);
        while (current) {
            path.unshift(current.name);
            current = current.parentId ? nodes.get(current.parentId) : undefined;
        }
        return path.length ? path.join(' / ') : 'Organization';
    }

    private mapOrgUnit(unit: { id: string; name: string; type: string; status: string; parentId?: string | null }): OrgUnit {
        return {
            id: unit.id,
            name: unit.name,
            type: this.mapTypeFromApi(unit.type),
            status: this.mapStatusFromApi(unit.status),
            parentId: unit.parentId ?? null,
        };
    }

    private mapOrgUnitRole(role: { roleId: string; role?: { name: string; description: string } }): OrgUnitRole {
        return {
            id: role.roleId,
            name: role.role?.name ?? role.roleId,
            description: role.role?.description,
        };
    }

    private mapStatusFromApi(status: string): OrgUnitStatus {
        return status === 'archived' ? 'Inactive' : 'Active';
    }

    private mapStatusToApi(status: OrgUnitStatus): string {
        return status === 'Inactive' ? 'archived' : 'active';
    }

    private mapTypeFromApi(type: string): OrgUnitType {
        const mapping: Record<string, OrgUnitType> = {
            organization: 'District',
            division: 'Division',
            department: 'Department',
            school: 'School',
            custom: 'Custom',
        };
        return mapping[type] ?? 'Department';
    }

    private mapTypeToApi(type: OrgUnitType): string {
        const mapping: Record<OrgUnitType, string> = {
            District: 'organization',
            School: 'school',
            Division: 'division',
            Department: 'department',
            Grade: 'department',
            Section: 'department',
            Custom: 'custom',
        };
        return mapping[type] ?? 'department';
    }

    private loadAssignableUsers(): void {
        if (this.setup.users().length) return;
        this.usersApi.getUsers().subscribe({
            next: (users) => {
                const rows = users.map(user => {
                    const { kind, ...rest } = mapApiUserToUserRow(user);
                    return rest;
                });
                this.setup.users.set(rows);
            },
            error: (error) => {
                this.toast.error(error?.message || 'Unable to load users for assignments.');
            },
        });
    }
}
