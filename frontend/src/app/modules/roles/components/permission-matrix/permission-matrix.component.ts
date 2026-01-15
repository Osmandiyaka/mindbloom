import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MbCheckboxComponent } from '@mindbloom/ui';
import { Permission } from '../../../../core/models/role.model';
import { PermissionAction } from '../../../../core/models/role.model';

@Component({
    selector: 'app-permission-matrix',
    standalone: true,
    imports: [CommonModule, FormsModule, MbCheckboxComponent],
    templateUrl: './permission-matrix.component.html',
    styleUrls: ['./permission-matrix.component.scss'],
})
export class PermissionMatrixComponent {
    readonly actionColumns = computed(() => {
        const base = [
            PermissionAction.READ,
            PermissionAction.CREATE,
            PermissionAction.UPDATE,
            PermissionAction.DELETE,
            PermissionAction.APPROVE,
        ];
        const present = new Set<string>();
        const walk = (node: Permission) => {
            (node.actions || []).forEach((action) => present.add(action));
            node.children?.forEach(walk);
        };
        this.permissionTree().forEach(walk);
        const available = base.filter((action) => present.has(action) || present.has(PermissionAction.MANAGE));
        return (available.length ? available : base).map((action) => ({
            key: action,
            label: this.actionLabel(action),
        }));
    });
    trackByGroup = (_: number, group: Permission) => group?.id ?? _;
    trackByPermission = (_: number, permission: Permission) => permission?.id ?? _;
    @Input() set permissions(value: Permission[]) {
        const safeTree = this.sanitizePermissionTree(value || []);
        this.permissionTree.set(safeTree);
        const current = this.expandedGroups();
        if (!current.size && safeTree.length) {
            this.expandedGroups.set(new Set([safeTree[0].id]));
        }
    }
    @Input() set selectedPermissions(value: string[]) {
        this.selectedIds.set(new Set(value || []));
    }
    @Input() set searchTerm(value: string | null | undefined) {
        if (value === undefined) return;
        this.search.set(value ?? '');
    }
    @Input() readOnly = false;
    @Input() showControls = true;
    @Output() selectedPermissionsChange = new EventEmitter<string[]>();

    search = signal('');
    permissionTree = signal<Permission[]>([]);
    selectedIds = signal<Set<string>>(new Set());
    expandedGroups = signal<Set<string>>(new Set());

    filteredGroups = computed(() => {
        const term = this.search().trim().toLowerCase();
        const tree = this.sanitizePermissionTree(this.permissionTree());
        if (!term) {
            return tree;
        }
        return tree
            .map((group) => this.filterGroup(group, term))
            .filter((group): group is Permission => !!group);
    });

    groupSelectionCount(group: Permission): number {
        return this.collectIds(group).filter((id) => this.selectedIds().has(id)).length;
    }

    groupTotalCount(group: Permission): number {
        return this.collectIds(group).length;
    }

    isGroupExpanded(groupId: string): boolean {
        return this.expandedGroups().has(groupId);
    }

    toggleGroupExpanded(groupId: string): void {
        const next = new Set(this.expandedGroups());
        if (next.has(groupId)) {
            next.delete(groupId);
        } else {
            next.add(groupId);
        }
        this.expandedGroups.set(next);
    }

    expandAll(): void {
        const next = new Set<string>();
        this.permissionTree().forEach((group) => {
            if (group?.id) {
                next.add(group.id);
            }
        });
        this.expandedGroups.set(next);
    }

    collapseAll(): void {
        this.expandedGroups.set(new Set());
    }

    toggleGroupSelection(group: Permission): void {
        if (this.readOnly) return;
        const ids = this.collectIds(group);
        const next = new Set(this.selectedIds());
        const allSelected = ids.every((id) => next.has(id));
        ids.forEach((id) => {
            if (allSelected) {
                next.delete(id);
            } else {
                next.add(id);
            }
        });
        this.selectedIds.set(next);
        this.selectedPermissionsChange.emit([...next]);
    }

    togglePermission(permission: Permission): void {
        if (this.readOnly) return;
        const ids = this.collectIds(permission);
        const next = new Set(this.selectedIds());
        const allSelected = ids.every((id) => next.has(id));
        ids.forEach((id) => {
            if (allSelected) {
                next.delete(id);
            } else {
                next.add(id);
            }
        });
        this.selectedIds.set(next);
        this.selectedPermissionsChange.emit([...next]);
    }

    isSelected(permissionId: string): boolean {
        return this.selectedIds().has(permissionId);
    }

    isPartiallySelected(permission: Permission): boolean {
        const ids = this.collectIds(permission);
        const selected = ids.filter((id) => this.selectedIds().has(id)).length;
        return selected > 0 && selected < ids.length;
    }

    actionsLabel(permission: Permission): string {
        return (permission.actions || []).map((action) => action.toUpperCase()).join(', ');
    }

    hasAction(permission: Permission, action: PermissionAction): boolean {
        const actions = permission.actions || [];
        if (actions.includes(PermissionAction.MANAGE)) {
            return true;
        }
        return actions.includes(action);
    }

    private actionLabel(action: PermissionAction): string {
        return String(action).charAt(0).toUpperCase() + String(action).slice(1);
    }

    private collectIds(group: Permission): string[] {
        const ids: string[] = [];
        const walk = (node: Permission) => {
            ids.push(node.id);
            node.children?.forEach(walk);
        };
        walk(group);
        return ids;
    }

    private filterGroup(group: Permission, term: string): Permission | null {
        const matchesGroup = this.matches(group, term);
        const children = (group.children || [])
            .map((child) => this.filterGroup(child, term))
            .filter((child): child is Permission => !!child);
        if (matchesGroup || children.length) {
            return { ...group, children };
        }
        return null;
    }

    private matches(permission: Permission, term: string): boolean {
        return (
            permission.displayName?.toLowerCase().includes(term)
            || permission.resource?.toLowerCase().includes(term)
            || permission.description?.toLowerCase().includes(term)
            || false
        );
    }

    private sanitizePermissionTree(tree: Permission[]): Permission[] {
        const sanitize = (node: Permission): Permission | null => {
            if (!node || !node.id) return null;
            const children = (node.children || [])
                .map((child) => sanitize(child))
                .filter((child): child is Permission => !!child);
            return { ...node, children };
        };
        return tree
            .map((node) => sanitize(node))
            .filter((node): node is Permission => !!node);
    }
}
