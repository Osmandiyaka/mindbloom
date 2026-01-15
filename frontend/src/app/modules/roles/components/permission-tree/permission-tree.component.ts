import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { Permission, PermissionAction } from '../../../../core/models/role.model';

@Component({
    selector: 'app-permission-tree',
    standalone: true,
    imports: [CommonModule, SearchInputComponent],
    templateUrl: './permission-tree.component.html',
    styleUrls: ['./permission-tree.component.scss']
})
export class PermissionTreeComponent {
    readonly actionColumns: PermissionAction[] = [
        PermissionAction.READ,
        PermissionAction.CREATE,
        PermissionAction.UPDATE,
        PermissionAction.DELETE,
        PermissionAction.APPROVE,
    ];
    @Input() set permissionTree(value: Permission[]) {
        this._permissionTree.set(value);
    }
    @Input() set selectedPermissions(value: string[]) {
        this._selectedPermissions.set(new Set(value));
    }
    @Input() readOnly = false;
    @Output() permissionsChange = new EventEmitter<string[]>();

    private _permissionTree = signal<Permission[]>([]);
    private _selectedPermissions = signal<Set<string>>(new Set());
    search = signal('');

    get permissionTreeValue() {
        return this._permissionTree();
    }

    get selectedCount(): number {
        return this._selectedPermissions().size;
    }

    get filteredTree(): Permission[] {
        const term = this.search().trim().toLowerCase();
        if (!term) {
            return this.permissionTreeValue;
        }
        return this.permissionTreeValue
            .map((module) => {
                const matchesModule =
                    module.displayName.toLowerCase().includes(term) ||
                    (module.description || '').toLowerCase().includes(term);
                const children = module.children || [];
                const matchedChildren = children.filter((child) => {
                    const text = `${child.displayName} ${child.description || ''}`.toLowerCase();
                    return text.includes(term);
                });
                if (matchesModule) {
                    return module;
                }
                if (matchedChildren.length) {
                    return { ...module, children: matchedChildren };
                }
                return null;
            })
            .filter((module): module is Permission => !!module);
    }

    expandedNodes = signal<Set<string>>(new Set());

    toggleNode(permissionId: string) {
        const expanded = this.expandedNodes();
        if (expanded.has(permissionId)) {
            expanded.delete(permissionId);
        } else {
            expanded.add(permissionId);
        }
        this.expandedNodes.set(new Set(expanded));
    }

    isExpanded(permissionId: string): boolean {
        return this.expandedNodes().has(permissionId);
    }

    expandAll(): void {
        this.expandedNodes.set(new Set(this.filteredTree.map((module) => module.id)));
    }

    collapseAll(): void {
        this.expandedNodes.set(new Set());
    }

    togglePermission(permission: Permission, event: Event) {
        if (this.readOnly) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        event.stopPropagation();

        const selected = new Set(this._selectedPermissions());
        const hasChildren = this.hasChildren(permission);
        const targetIds = hasChildren ? this.collectDescendantIds(permission) : [permission.id];

        const allSelected = targetIds.every((id) => selected.has(id));
        targetIds.forEach((id) => {
            if (allSelected) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
        });

        this._selectedPermissions.set(selected);
        this.permissionsChange.emit(Array.from(selected));
    }

    isSelected(permissionId: string): boolean {
        return this._selectedPermissions().has(permissionId);
    }

    isIndeterminate(permission: Permission): boolean {
        if (!this.hasChildren(permission)) {
            return false;
        }
        const targetIds = this.collectDescendantIds(permission);
        const selectedCount = targetIds.filter((id) => this._selectedPermissions().has(id)).length;
        return selectedCount > 0 && selectedCount < targetIds.length;
    }

    hasChildren(permission: Permission): boolean {
        return !!(permission.children && permission.children.length > 0);
    }

    getActionBadges(actions: PermissionAction[]): string {
        return actions.map(a => a.toUpperCase()).join(', ');
    }

    moduleCoverage(permission: Permission): { enabled: number; total: number } {
        if (!this.hasChildren(permission)) {
            return { enabled: this.isSelected(permission.id) ? 1 : 0, total: 1 };
        }
        const ids = this.collectDescendantIds(permission);
        const enabled = ids.filter((id) => this.isSelected(id)).length;
        return { enabled, total: ids.length };
    }

    moduleSelectionState(permission: Permission): { checked: boolean; indeterminate: boolean } {
        if (!this.hasChildren(permission)) {
            return { checked: this.isSelected(permission.id), indeterminate: false };
        }
        const coverage = this.moduleCoverage(permission);
        return {
            checked: coverage.enabled === coverage.total && coverage.total > 0,
            indeterminate: coverage.enabled > 0 && coverage.enabled < coverage.total,
        };
    }

    displayActions(actions: PermissionAction[]): PermissionAction[] {
        return actions.filter((action) => action !== PermissionAction.MANAGE);
    }

    hasAction(permission: Permission, action: PermissionAction): boolean {
        const actions = permission.actions || [];
        if (actions.includes(PermissionAction.MANAGE)) {
            return true;
        }
        return actions.includes(action);
    }

    rowsForGroup(group: Permission): Array<{ permission: Permission; depth: number }> {
        return this.collectRows(group.children || [], 0, []);
    }

    private collectDescendantIds(permission: Permission): string[] {
        const ids: string[] = [];
        const walk = (node: Permission) => {
            (node.children || []).forEach((child) => {
                ids.push(child.id);
                walk(child);
            });
        };
        walk(permission);
        return ids;
    }

    private collectRows(
        nodes: Permission[],
        depth: number,
        rows: Array<{ permission: Permission; depth: number }>
    ): Array<{ permission: Permission; depth: number }> {
        nodes.forEach((node) => {
            rows.push({ permission: node, depth });
            if (node.children?.length) {
                this.collectRows(node.children, depth + 1, rows);
            }
        });
        return rows;
    }
}
