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

        if (selected.has(permission.id)) {
            // Unselect this permission and all children
            selected.delete(permission.id);
            this.removeChildPermissions(permission, selected);
        } else {
            // Select this permission
            selected.add(permission.id);
        }

        this._selectedPermissions.set(selected);
        this.permissionsChange.emit(Array.from(selected));
    }

    private removeChildPermissions(permission: Permission, selected: Set<string>) {
        if (permission.children) {
            permission.children.forEach(child => {
                selected.delete(child.id);
                this.removeChildPermissions(child, selected);
            });
        }
    }

    isSelected(permissionId: string): boolean {
        return this._selectedPermissions().has(permissionId);
    }

    isIndeterminate(permission: Permission): boolean {
        if (!permission.children || permission.children.length === 0) {
            return false;
        }

        const selected = this._selectedPermissions();
        const childrenSelected = permission.children.filter(child => selected.has(child.id)).length;

        return childrenSelected > 0 && childrenSelected < permission.children.length;
    }

    hasChildren(permission: Permission): boolean {
        return !!(permission.children && permission.children.length > 0);
    }

    getActionBadges(actions: PermissionAction[]): string {
        return actions.map(a => a.toUpperCase()).join(', ');
    }

    moduleCoverage(permission: Permission): { enabled: number; total: number } {
        const children = permission.children || [];
        if (!children.length) {
            return { enabled: this.isSelected(permission.id) ? 1 : 0, total: 1 };
        }
        const enabled = children.filter((child) => this.isSelected(child.id)).length;
        return { enabled, total: children.length };
    }

    moduleSelectionState(permission: Permission): { checked: boolean; indeterminate: boolean } {
        const coverage = this.moduleCoverage(permission);
        if (coverage.total === 0) {
            return { checked: false, indeterminate: false };
        }
        return {
            checked: coverage.enabled === coverage.total,
            indeterminate: coverage.enabled > 0 && coverage.enabled < coverage.total,
        };
    }

    displayActions(actions: PermissionAction[]): PermissionAction[] {
        return actions.filter((action) => action !== PermissionAction.MANAGE);
    }
}
