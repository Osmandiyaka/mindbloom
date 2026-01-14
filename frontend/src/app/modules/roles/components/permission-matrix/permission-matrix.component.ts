import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MbCheckboxComponent } from '@mindbloom/ui';
import { Permission } from '../../../../core/models/role.model';

@Component({
    selector: 'app-permission-matrix',
    standalone: true,
    imports: [CommonModule, FormsModule, MbCheckboxComponent],
    templateUrl: './permission-matrix.component.html',
    styleUrls: ['./permission-matrix.component.scss'],
})
export class PermissionMatrixComponent {
    @Input() set permissions(value: Permission[]) {
        this.permissionTree.set(value || []);
        const current = this.expandedGroups();
        if (!current.size && value?.length) {
            this.expandedGroups.set(new Set([value[0].id]));
        }
    }
    @Input() set selectedPermissions(value: string[]) {
        this.selectedIds.set(new Set(value || []));
    }
    @Input() readOnly = false;
    @Output() selectedPermissionsChange = new EventEmitter<string[]>();

    search = signal('');
    permissionTree = signal<Permission[]>([]);
    selectedIds = signal<Set<string>>(new Set());
    expandedGroups = signal<Set<string>>(new Set());

    filteredGroups = computed(() => {
        const term = this.search().trim().toLowerCase();
        if (!term) {
            return this.permissionTree();
        }
        return this.permissionTree()
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
        const next = new Set(this.selectedIds());
        if (next.has(permission.id)) {
            next.delete(permission.id);
        } else {
            next.add(permission.id);
        }
        this.selectedIds.set(next);
        this.selectedPermissionsChange.emit([...next]);
    }

    isSelected(permissionId: string): boolean {
        return this.selectedIds().has(permissionId);
    }

    actionsLabel(permission: Permission): string {
        return (permission.actions || []).map((action) => action.toUpperCase()).join(', ');
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
}
