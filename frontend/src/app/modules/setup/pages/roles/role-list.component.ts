import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Role, Permission } from '../../../../core/models/role.model';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, PermissionTreeSelectorComponent],
    template: `
    <div class="role-list-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p class="subtitle">Manage user roles and access control</p>
        </div>
        <button class="btn btn-primary" (click)="createRole()">
          <span class="icon">➕</span>
          Create Custom Role
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading roles...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="roleService.error()" class="error-banner">
        <span class="icon">⚠️</span>
        {{ roleService.error() }}
      </div>

      <!-- Roles Grid -->
      <div *ngIf="!roleService.loading()" class="roles-grid">
        <!-- System Roles Section -->
        <div class="section">
          <h2 class="section-title">
            <span class="icon">🔒</span>
            System Roles
            <span class="badge">{{ systemRoles().length }}</span>
          </h2>
          <div class="role-cards">
            <div *ngFor="let role of systemRoles()" class="role-card system-role">
              <div class="role-header">
                <h3>{{ role.name }}</h3>
                <span class="system-badge">System</span>
              </div>
              <p class="role-description">{{ role.description }}</p>
              <div class="role-stats">
                <div class="stat">
                  <span class="stat-value">{{ role.permissions.length }}</span>
                  <span class="stat-label">Permissions</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getUniqueResources(role).length }}</span>
                  <span class="stat-label">Resources</span>
                </div>
              </div>
              <div class="role-actions">
                <button class="btn-text" (click)="viewRole(role.id)">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Roles Section -->
        <div class="section">
          <h2 class="section-title">
            <span class="icon">⚙️</span>
            Custom Roles
            <span class="badge">{{ customRoles().length }}</span>
          </h2>
          
          <div *ngIf="customRoles().length === 0" class="empty-state">
            <span class="empty-icon">📋</span>
            <h3>No custom roles yet</h3>
            <p>Create custom roles to fit your school's unique needs</p>
            <button class="btn btn-primary" (click)="createRole()">
              Create Your First Role
            </button>
          </div>

          <div *ngIf="customRoles().length > 0" class="role-cards">
            <div *ngFor="let role of customRoles()" class="role-card custom-role">
              <div class="role-header">
                <h3>{{ role.name }}</h3>
                <span class="custom-badge">Custom</span>
              </div>
              <p class="role-description">{{ role.description }}</p>
              <div class="role-stats">
                <div class="stat">
                  <span class="stat-value">{{ role.permissions.length }}</span>
                  <span class="stat-label">Permissions</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getUniqueResources(role).length }}</span>
                  <span class="stat-label">Resources</span>
                </div>
              </div>
              <div class="role-actions">
                <button class="btn-text" (click)="editRole(role.id)">
                  ✏️ Edit
                </button>
                <button class="btn-text" (click)="managePermissions(role)">
                  🔐 Manage Permissions
                </button>
                <button class="btn-text danger" (click)="deleteRole(role)">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Management Modal -->
      @if (showPermissionDialog()) {
        <div class="modal-overlay" (click)="closePermissionDialog()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2>Manage Permissions</h2>
                <p class="modal-subtitle">{{ selectedRole()?.name }}</p>
              </div>
              <button type="button" class="btn-close" (click)="closePermissionDialog()">×</button>
            </div>
            
            <div class="modal-body">
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
              <button type="button" class="btn btn-primary" (click)="savePermissions()">
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .role-list-container {
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

    h1 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #E5E7EB;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      background: #FEE2E2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section {
      margin-bottom: 3rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
    }

    .badge {
      background: #E5E7EB;
      color: #6B7280;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .role-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .role-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .role-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .role-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .system-badge, .custom-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .system-badge {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .custom-badge {
      background: #D1FAE5;
      color: #065F46;
    }

    .role-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .role-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem 0;
      border-top: 1px solid #F3F4F6;
      border-bottom: 1px solid #F3F4F6;
      margin-bottom: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #3B82F6;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-text {
      background: none;
      border: none;
      color: #3B82F6;
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem;
      transition: all 0.2s;
    }

    .btn-text:hover {
      color: #2563EB;
    }

    .btn-text.danger {
      color: #EF4444;
    }

    .btn-text.danger:hover {
      color: #DC2626;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #F9FAFB;
      border: 2px dashed #E5E7EB;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
    }

    .icon {
      font-size: 1.25rem;
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
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border-bottom: 1px solid #E5E7EB;
    }

    .modal-header h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
    }

    .modal-subtitle {
      color: #6B7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #9CA3AF;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: #F3F4F6;
      color: #111827;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #E5E7EB;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
    }
  `]
})
export class RoleListComponent implements OnInit {
    roleService = inject(RoleService);
    private router = inject(Router);

    systemRoles = signal<Role[]>([]);
    customRoles = signal<Role[]>([]);
    
    // Permission management state
    showPermissionDialog = signal(false);
    selectedRole = signal<Role | null>(null);
    permissionTree = signal<Permission[]>([]);
    currentPermissionIds = signal<string[]>([]);
    tempSelectedIds = signal<string[]>([]);

    ngOnInit() {
        this.loadRoles();
        this.loadPermissionTree();
    }

    loadRoles() {
        this.roleService.getRoles().subscribe({
            next: (roles) => {
                this.systemRoles.set(roles.filter(r => r.isSystemRole));
                this.customRoles.set(roles.filter(r => !r.isSystemRole));
            }
        });
    }

    loadPermissionTree() {
        this.roleService.getPermissionTree().subscribe({
            next: (tree) => {
                this.permissionTree.set(tree);
            },
            error: (err) => {
                console.error('Failed to load permission tree:', err);
            }
        });
    }

    getUniqueResources(role: Role): string[] {
        const resources = new Set(role.permissions.map(p => p.resource));
        return Array.from(resources);
    }

    createRole() {
        this.router.navigate(['/setup/roles/create']);
    }

    viewRole(id: string) {
        this.router.navigate(['/setup/roles', id]);
    }

    editRole(id: string) {
        this.router.navigate(['/setup/roles', id, 'edit']);
    }

    deleteRole(role: Role) {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?\n\nThis action cannot be undone.`)) {
            this.roleService.deleteRole(role.id).subscribe({
                next: () => {
                    // Role already removed from signal by service
                },
                error: (err) => {
                    alert(`Failed to delete role: ${err.message}`);
                }
            });
        }
    }

    managePermissions(role: Role) {
        this.selectedRole.set(role);
        this.currentPermissionIds.set(role.permissions.map(p => p.id));
        this.tempSelectedIds.set(role.permissions.map(p => p.id));
        this.showPermissionDialog.set(true);
    }

    closePermissionDialog() {
        this.showPermissionDialog.set(false);
        this.selectedRole.set(null);
        this.tempSelectedIds.set([]);
    }

    onPermissionSelectionChange(selectedIds: string[]) {
        this.tempSelectedIds.set(selectedIds);
    }

    savePermissions() {
        const role = this.selectedRole();
        if (!role) return;

        this.roleService.addPermissionsToRole(role.id, this.tempSelectedIds()).subscribe({
            next: () => {
                this.closePermissionDialog();
                this.loadRoles(); // Reload to get updated permissions
            },
            error: (err) => {
                alert(`Failed to update permissions: ${err.message}`);
            }
        });
    }
}
