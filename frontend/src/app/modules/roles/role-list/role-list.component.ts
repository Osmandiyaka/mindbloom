import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './role-list.component.html',
    styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
    private roleService = inject(RoleService);

    roles = this.roleService.roles;
    loading = this.roleService.loading;
    error = this.roleService.error;

    showDeleteConfirm = signal(false);
    roleToDelete = signal<Role | null>(null);

    ngOnInit() {
        this.loadRoles();
    }

    loadRoles() {
        this.roleService.getRoles().subscribe();
    }

    confirmDelete(role: Role) {
        if (role.isSystemRole) {
            alert('System roles cannot be deleted');
            return;
        }
        this.roleToDelete.set(role);
        this.showDeleteConfirm.set(true);
    }

    deleteRole() {
        const role = this.roleToDelete();
        if (!role) return;

        this.roleService.deleteRole(role.id).subscribe({
            next: () => {
                this.showDeleteConfirm.set(false);
                this.roleToDelete.set(null);
            },
            error: (err) => {
                alert(err.error?.message || 'Failed to delete role');
            }
        });
    }

    cancelDelete() {
        this.showDeleteConfirm.set(false);
        this.roleToDelete.set(null);
    }

    getPermissionCount(role: Role): number {
        return role.permissions?.length || 0;
    }
}
