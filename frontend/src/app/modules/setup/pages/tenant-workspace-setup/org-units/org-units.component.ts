import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from '../../../../../core/ui/toast/toast.service';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { OrgUnit, OrgUnitDeleteImpact, OrgUnitNode, OrgUnitRole, OrgUnitStatus, OrgUnitType, UserRow } from '../tenant-workspace-setup.models';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';

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

    readonly users = this.setup.users;
    readonly orgUnits = this.setup.orgUnits;
    readonly orgUnitMemberIds = this.setup.orgUnitMemberIds;
    readonly orgUnitRoles = this.setup.orgUnitRoles;

    activeOrgUnitId = signal<string | null>(null);
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
    assignMembersOpen = signal(false);
    assignMemberIds = signal<string[]>([]);
    assignRolesOpen = signal(false);
    assignRoleIds = signal<string[]>([]);
    assignRoleDraft = signal<OrgUnitRole[]>([]);
    isOrgUnitDeleteOpen = signal(false);
    orgUnitDeleteTarget = signal<OrgUnit | null>(null);
    orgUnitDeleteImpact = signal<OrgUnitDeleteImpact | null>(null);
    orgUnitDeleteImpactLoading = signal(false);
    orgUnitDeleteConfirm = signal('');
    orgUnitDeleteError = signal('');
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
        const activeId = this.activeOrgUnitId();
        if (!activeId) return [];
        const memberIds = new Set(this.orgUnitMemberIds()[activeId] || []);
        const search = this.orgUnitMemberSearch().trim().toLowerCase();
        return this.users().filter(user => {
            if (!memberIds.has(user.id)) return false;
            if (!search) return true;
            const roleName = user.roleName || '';
            return (
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                roleName.toLowerCase().includes(search)
            );
        });
    });
    readonly selectedOrgUnitMemberCount = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return 0;
        return (this.orgUnitMemberIds()[activeId] || []).length;
    });
    readonly selectedOrgUnitRoles = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return [];
        const roles = this.orgUnitRoles()[activeId] || [];
        const search = this.orgUnitRoleSearch().trim().toLowerCase();
        if (!search) return roles;
        return roles.filter(role => {
            const haystack = [role.name, role.description].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    });
    readonly selectedOrgUnitRoleCount = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return 0;
        return (this.orgUnitRoles()[activeId] || []).length;
    });
    readonly orgUnitDeleteRequiresConfirm = computed(() => {
        const impact = this.orgUnitDeleteImpact();
        return !!impact && impact.childUnits > 0;
    });

    trackOrgUnit = (_: number, node: OrgUnitNode) => node.id;
    trackOrgUnitRole = (_: number, role: OrgUnitRole) => role.id;
    trackUserRow = (_: number, user: { id: string }) => user.id;

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
        const name = this.orgUnitFormName().trim();
        if (!name) {
            this.orgUnitFormError.set('Unit name is required.');
            return;
        }

        const newUnit: OrgUnit = {
            id: this.nextOrgUnitId(),
            name,
            type: this.orgUnitFormType(),
            status: this.orgUnitFormStatus(),
            parentId: this.orgUnitFormParentId() || undefined
        };

        this.orgUnits.update(items => [...items, newUnit]);
        if (newUnit.parentId) {
            this.expandedOrgUnitIds.update(items => items.includes(newUnit.parentId!)
                ? items
                : [...items, newUnit.parentId!]);
        }
        this.activeOrgUnitId.set(newUnit.id);
        this.cancelOrgUnitForm();
    }

    openDeleteOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitDeleteTarget.set(target);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set('');
        this.orgUnitDeleteImpact.set(null);
        this.orgUnitDeleteImpactLoading.set(true);
        this.orgUnitDeleteSubmitting.set(false);
        this.isOrgUnitDeleteOpen.set(true);
        const impact = this.buildOrgUnitDeleteImpact(target.id);
        setTimeout(() => {
            this.orgUnitDeleteImpact.set(impact);
            this.orgUnitDeleteImpactLoading.set(false);
        }, 120);
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
        this.orgUnitDeleteImpactLoading.set(false);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set('');
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
        this.orgUnits.update(items => items.map(unit => unit.id === target.id ? { ...unit, name: nextName } : unit));
        this.toast.success(`Organizational unit renamed to "${nextName}".`);
        this.requestCloseRenameOrgUnit();
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
        this.orgUnits.update(items => items.map(unit => unit.id === target.id
            ? { ...unit, status: 'Inactive' }
            : unit));
        this.toast.success(`Organizational unit "${target.name}" deactivated.`);
        this.requestCloseDeactivateOrgUnit();
    }

    canDeleteSelectedOrgUnit(): boolean {
        return !!this.selectedOrgUnit() && this.canDeleteOrgUnit() && !this.isOrgUnitDeleteLocked();
    }

    deleteSelectedOrgUnit(): void {
        const target = this.orgUnitDeleteTarget();
        if (!target || this.orgUnitDeleteSubmitting()) return;
        if (this.orgUnitDeleteRequiresConfirm() && !this.isOrgUnitDeleteConfirmValid()) return;
        this.orgUnitDeleteSubmitting.set(true);
        const deleteIds = this.collectOrgUnitDescendantIds(target.id);
        deleteIds.unshift(target.id);
        this.orgUnits.update(items => items.filter(unit => !deleteIds.includes(unit.id)));
        this.orgUnitMemberIds.update(map => {
            const next = { ...map };
            deleteIds.forEach(id => delete next[id]);
            return next;
        });
        this.orgUnitRoles.update(map => {
            const next = { ...map };
            deleteIds.forEach(id => delete next[id]);
            return next;
        });
        this.expandedOrgUnitIds.update(items => items.filter(id => !deleteIds.includes(id)));
        this.selectFallbackOrgUnit(target);
        this.toast.success(`Organizational unit "${target.name}" and its child units were deleted.`);
        this.requestCloseDeleteOrgUnit();
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
        this.activeOrgUnitId.set(id);
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
        this.assignMemberIds.set([...(this.orgUnitMemberIds()[activeId] || [])]);
        this.assignMembersOpen.set(true);
    }

    cancelAssignMembers(): void {
        this.assignMembersOpen.set(false);
    }

    toggleAssignMember(userId: string, event: Event): void {
        const target = event.target as HTMLInputElement | null;
        const checked = target?.checked ?? false;
        this.assignMemberIds.update(ids => {
            if (checked) {
                return ids.includes(userId) ? ids : [...ids, userId];
            }
            return ids.filter(id => id !== userId);
        });
    }

    saveAssignMembers(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const memberIds = this.assignMemberIds();
        this.orgUnitMemberIds.update(map => ({
            ...map,
            [activeId]: memberIds
        }));
        this.assignMembersOpen.set(false);
    }

    removeMemberFromOrgUnit(user: UserRow): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitMemberIds.update(map => ({
            ...map,
            [activeId]: (map[activeId] || []).filter(id => id !== user.id)
        }));
    }

    confirmRemoveMemberFromOrgUnit(user: UserRow): void {
        const label = user.name || user.email;
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
        const currentRoles = this.orgUnitRoles()[activeId] || [];
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
        this.orgUnitRoles.update(map => ({
            ...map,
            [activeId]: this.assignRoleDraft()
        }));
        this.assignRolesOpen.set(false);
    }

    removeRoleFromOrgUnit(role: OrgUnitRole): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitRoles.update(map => ({
            ...map,
            [activeId]: (map[activeId] || []).filter(item => item.id !== role.id)
        }));
    }

    private commitOrgUnitParentChange(action: 'moved' | 'updated'): void {
        const target = this.orgUnitMoveTarget();
        if (!target || this.orgUnitMoveSubmitting()) return;
        const nextParentId = this.orgUnitMoveParentId();
        if (!this.isOrgUnitParentAllowed(target.id, nextParentId)) {
            this.orgUnitMoveError.set('Select a valid parent unit.');
            return;
        }
        if ((nextParentId ?? null) === (target.parentId ?? null)) {
            this.closeOrgUnitMoveModal();
            return;
        }
        this.orgUnitMoveSubmitting.set(true);
        this.orgUnits.update(items => items.map(unit => unit.id === target.id
            ? { ...unit, parentId: nextParentId ?? undefined }
            : unit));
        if (nextParentId) {
            this.expandedOrgUnitIds.update(items => items.includes(nextParentId)
                ? items
                : [...items, nextParentId]);
        }
        this.toast.success(`Organizational unit "${target.name}" ${action}.`);
        this.closeOrgUnitMoveModal();
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

    private buildOrgUnitDeleteImpact(id: string): OrgUnitDeleteImpact {
        const descendantIds = this.collectOrgUnitDescendantIds(id);
        const affectedIds = [id, ...descendantIds];
        const memberIds = new Set<string>();
        const memberMap = this.orgUnitMemberIds();
        affectedIds.forEach(unitId => {
            (memberMap[unitId] || []).forEach(memberId => memberIds.add(memberId));
        });
        const roleMap = this.orgUnitRoles();
        const rolesCount = affectedIds.reduce((count, unitId) => count + (roleMap[unitId]?.length || 0), 0);
        return {
            childUnits: descendantIds.length,
            members: memberIds.size,
            roles: rolesCount
        };
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

    private selectFallbackOrgUnit(deletedUnit: OrgUnit): void {
        const remaining = this.orgUnits();
        if (!remaining.length) {
            this.activeOrgUnitId.set(null);
            return;
        }
        const parentId = deletedUnit.parentId ?? null;
        if (parentId && remaining.some(unit => unit.id === parentId)) {
            this.selectOrgUnit(parentId);
            return;
        }
        const root = remaining.find(unit => !unit.parentId);
        if (root) {
            this.selectOrgUnit(root.id);
            return;
        }
        this.activeOrgUnitId.set(remaining[0].id);
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

    private nextOrgUnitId(): string {
        const maxId = this.orgUnits().reduce((max, unit) => {
            const match = unit.id.match(/org-unit-(\d+)/);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        return `org-unit-${maxId + 1}`;
    }
}
