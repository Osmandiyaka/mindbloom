import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { Permission } from '../../../../core/models/role.model';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, PermissionTreeSelectorComponent],
  template: `
    <div class="user-list-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Users</h1>
          <p class="subtitle">Manage users and their permissions</p>
        </div>
        <button class="btn btn-primary" (click)="createUser()">
          + Create User
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-banner">
        <span class="icon">⚠️</span>
        {{ error() }}
      </div>

      <!-- Users Table -->
      <div *ngIf="!loading() && !error()" class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Direct Permissions</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users()">
              <td>
                <div class="user-info">
                  <div 
                    class="user-avatar" 
                    [style.background-image]="user.profilePicture ? 'url(' + user.profilePicture + ')' : 'none'"
                  >
                    <span *ngIf="!user.profilePicture">{{ getInitials(user.name) }}</span>
                  </div>
                  <span class="user-name">{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span *ngIf="user.role" class="role-badge" [class.admin]="user.role.name?.includes('Admin')">
                  {{ user.role.name }}
                </span>
                <span *ngIf="!user.role" class="role-badge no-role">
                  No role
                </span>
              </td>
              <td>
                <span class="permission-count">
                  {{ user.permissions.length }} permission(s)
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-text" (click)="editUser(user)">
                    ✏️ Edit
                  </button>
                  <button class="btn-text" (click)="managePermissions(user)">
                    🔐 Permissions
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="users().length === 0" class="empty-state">
          <span class="empty-icon">👥</span>
          <h3>No users found</h3>
          <p>Users will appear here once they register</p>
        </div>
      </div>

      <!-- Permission Management Modal -->
      @if (showPermissionDialog()) {
        <div class="modal-overlay" (click)="closePermissionDialog()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2>Manage User Permissions</h2>
                <p class="modal-subtitle">{{ selectedUser()?.name }}</p>
              </div>
              <button type="button" class="btn-close" (click)="closePermissionDialog()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="info-banner">
                <span class="icon">ℹ️</span>
                <p>These are direct permissions assigned to the user. The user will also inherit permissions from their role.</p>
              </div>
              
              <app-permission-tree-selector
                [permissions]="permissionTree()"
                [selectedPermissionIds]="currentPermissionIds()"
                (selectionChange)="onPermissionSelectionChange($event)"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closePermissionDialog()">
                Cancel
              </button>
              <button type="button" class="btn btn-primary" (click)="savePermissions()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Permissions' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-list-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-banner {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      padding: 1rem;
      color: #c33;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .users-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table thead {
      background: #f8f9fa;
      border-bottom: 2px solid #e9ecef;
    }

    .users-table th {
      text-align: left;
      padding: 1rem;
      font-weight: 600;
      color: #495057;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .users-table td {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      vertical-align: middle;
    }

    .users-table tbody tr:hover {
      background: #f8f9fa;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: cover;
      background-position: center;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 500;
      color: #1a1a1a;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e9ecef;
      color: #495057;
      text-transform: capitalize;
    }

    .role-badge.admin {
      background: #d4edda;
      color: #155724;
    }

    .role-badge.no-role {
      background: #fff3cd;
      color: #856404;
    }

    .permission-count {
      color: #666;
      font-size: 0.875rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-text {
      background: none;
      border: none;
      color: #6366f1;
      cursor: pointer;
      padding: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-text:hover {
      color: #4f46e5;
      text-decoration: underline;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #666;
      margin: 0;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.25rem 0;
    }

    .modal-subtitle {
      color: #666;
      margin: 0;
      font-size: 0.875rem;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 2rem;
      line-height: 1;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .btn-close:hover {
      color: #333;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .info-banner {
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .info-banner .icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .info-banner p {
      margin: 0;
      color: #0c4a6e;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #6366f1;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4f46e5;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);

  // Permission management
  showPermissionDialog = signal(false);
  selectedUser = signal<User | null>(null);
  permissionTree = signal<Permission[]>([]);
  currentPermissionIds = signal<string[]>([]);
  tempSelectedIds = signal<string[]>([]);

  ngOnInit() {
    this.loadUsers();
    this.loadPermissionTree();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
        console.error('Error loading users:', err);
      }
    });
  }

  loadPermissionTree() {
    this.roleService.getPermissionTree().subscribe({
      next: (tree) => {
        this.permissionTree.set(tree);
      },
      error: (err) => {
        console.error('Error loading permission tree:', err);
      }
    });
  }

  createUser() {
    this.router.navigate(['/setup/users/create']);
  }

  editUser(user: User) {
    this.router.navigate(['/setup/users/edit', user.id]);
  }

  managePermissions(user: User) {
    this.selectedUser.set(user);
    const permissionIds = user.permissions.map(p => p.id || p.resource).filter(id => !!id);
    this.currentPermissionIds.set(permissionIds);
    this.tempSelectedIds.set([...permissionIds]);
    this.showPermissionDialog.set(true);
  }

  onPermissionSelectionChange(selectedIds: string[]) {
    this.tempSelectedIds.set(selectedIds);
  }

  savePermissions() {
    const user = this.selectedUser();
    if (!user) return;

    this.saving.set(true);

    this.userService.addPermissionsToUser(user.id, this.tempSelectedIds()).subscribe({
      next: (updatedUser) => {
        // Update the user in the list
        this.users.update(users =>
          users.map(u => u.id === updatedUser.id ? updatedUser : u)
        );
        this.closePermissionDialog();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set('Failed to update user permissions. Please try again.');
        this.saving.set(false);
        console.error('Error updating permissions:', err);
      }
    });
  }

  closePermissionDialog() {
    this.showPermissionDialog.set(false);
    this.selectedUser.set(null);
    this.tempSelectedIds.set([]);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
