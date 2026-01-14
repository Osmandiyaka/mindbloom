import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Role, CreateRoleDto, UpdateRoleDto, Permission } from '../models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/roles`;
    private permissionsApiUrl = `${environment.apiUrl}/permissions`;

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

        return this.http.get<Role[]>(this.apiUrl).pipe(
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
        return this.http.get<Role>(`${this.apiUrl}/${id}`);
    }

    /**
     * Create a new custom role
     */
    createRole(dto: CreateRoleDto): Observable<Role> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.post<Role>(this.apiUrl, dto).pipe(
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

        return this.http.put<Role>(`${this.apiUrl}/${id}`, dto).pipe(
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

        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
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

        return this.http.get<Permission[]>(`${this.permissionsApiUrl}/tree`).pipe(
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

        return this.http.post<Role>(`${this.apiUrl}/${roleId}/permissions`, { permissionIds }).pipe(
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
