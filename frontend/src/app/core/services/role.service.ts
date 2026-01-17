import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Role, CreateRoleDto, UpdateRoleDto, Permission } from '../models/role.model';
import { ApiClient } from '../http/api-client.service';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private api = inject(ApiClient);
    private basePath = 'roles';
    private permissionsPath = 'permissions';

    // Signals for reactive state management
    roles = signal<Role[]>([]);
    permissionTree = signal<Permission[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    /**
     * Get all roles for current tenant
     */
    getRoles(): Observable<Role[]> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.get<Role[]>(this.basePath).pipe(
            tap({
                next: (roles) => {
                    const safeRoles = (roles || []).filter((role) => !!role && !!role.id);
                    this.roles.set(safeRoles);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.message || 'Failed to load roles');
                    this.loading.set(false);
                }
            })
        );
    }

    /**
     * Get role by ID
     */
    getRoleById(id: string): Observable<Role> {
        return this.api.get<Role>(`${this.basePath}/${id}`);
    }

    /**
     * Create a new custom role
     */
    createRole(dto: CreateRoleDto): Observable<Role> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.post<Role>(this.basePath, dto).pipe(
            tap({
                next: (newRole) => {
                    this.roles.update(roles => [...roles, newRole]);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to create role');
                    this.loading.set(false);
                }
            })
        );
    }

    /**
     * Update an existing role
     */
    updateRole(id: string, dto: UpdateRoleDto): Observable<Role> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.put<Role>(`${this.basePath}/${id}`, dto).pipe(
            tap({
                next: (updatedRole) => {
                    this.roles.update(roles =>
                        roles.map(r => r.id === id ? updatedRole : r)
                    );
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to update role');
                    this.loading.set(false);
                }
            })
        );
    }

    /**
     * Delete a role
     */
    deleteRole(id: string): Observable<void> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.delete<void>(`${this.basePath}/${id}`).pipe(
            tap({
                next: () => {
                    this.roles.update(roles => roles.filter(r => r.id !== id));
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to delete role');
                    this.loading.set(false);
                }
            })
        );
    }

    /**
     * Get system roles only
     */
    getSystemRoles(): Role[] {
        return this.roles().filter(r => r.isSystemRole);
    }

    /**
     * Get custom roles only
     */
    getCustomRoles(): Role[] {
        return this.roles().filter(r => !r.isSystemRole);
    }

    /**
     * Get permission tree
     */
    getPermissionTree(): Observable<Permission[]> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.get<Permission[]>(`${this.permissionsPath}/tree`).pipe(
            tap({
                next: (tree) => {
                    this.permissionTree.set(this.sanitizePermissionTree(tree || []));
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.message || 'Failed to load permissions');
                    this.loading.set(false);
                }
            })
        );
    }

    /**
     * Add permissions to a role
     */
    addPermissionsToRole(roleId: string, permissionIds: string[]): Observable<Role> {
        this.loading.set(true);
        this.error.set(null);

        return this.api.post<Role>(`${this.basePath}/${roleId}/permissions`, { permissionIds }).pipe(
            tap({
                next: (updatedRole) => {
                    this.roles.update(roles =>
                        roles.map(r => r.id === roleId ? updatedRole : r)
                    );
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to add permissions');
                    this.loading.set(false);
                }
            })
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
