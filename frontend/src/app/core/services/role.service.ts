import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Role, CreateRoleDto, UpdateRoleDto } from '../models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  // Signals for reactive state management
  roles = signal<Role[]>([]);
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
          this.roles.set(roles);
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
}
