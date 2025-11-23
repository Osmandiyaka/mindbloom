import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission, PermissionAction } from '../../../../core/models/role.model';

@Component({
    selector: 'app-permission-tree',
    standalone: true,
    imports: [CommonModule],
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
  @Output() permissionsChange = new EventEmitter<string[]>();

  private _permissionTree = signal<Permission[]>([]);
  private _selectedPermissions = signal<Set<string>>(new Set());

  get permissionTreeValue() {
    return this._permissionTree();
  }

  expandedNodes = signal<Set<string>>(new Set());    toggleNode(permissionId: string) {
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

    togglePermission(permission: Permission, event: Event) {
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
}