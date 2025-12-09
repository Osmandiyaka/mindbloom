import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Role, Permission } from '../../../../core/models/role.model';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PermissionTreeSelectorComponent],
  template: `
    <div class="role-list-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p class="subtitle">Manage user roles and access control</p>
        </div>
        <button class="btn btn-primary create-role-btn" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 4 6v6c0 5 4 8.5 8 10 4-1.5 8-5 8-10V6l-8-4Z" fill="currentColor" opacity="0.85"/>
            <path d="M12 7v4m0 0v4m0-4h4m-4 0H8" stroke="#0f0f12" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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
            <button class="btn btn-primary" (click)="openCreateModal()">
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

      @if (showCreateDialog()) {
        <div class="modal-overlay" (click)="closeCreateModal()">
          <div class="modal-content create-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <p class="eyebrow">Security</p>
                <h2 class="themed-title">Create Custom Role</h2>
              </div>
              <button type="button" class="btn-close" (click)="closeCreateModal()">×</button>
            </div>

            <div class="modal-body create-form">
              <div class="fields">
                <label class="field inset">
                  <span>Role name <span class="required">*</span></span>
                  <input type="text" [(ngModel)]="newRole.name" placeholder="e.g., Data Entry" />
                </label>
                <label class="field inset">
                  <span>Description</span>
                  <textarea rows="3" [(ngModel)]="newRole.description" placeholder="What can this role do?"></textarea>
                </label>
              </div>

              <div class="permission-selector">
                <p class="hint">Select permissions to assign on creation.</p>
                <app-permission-tree-selector
                  [permissions]="permissionTree()"
                  [selectedPermissionIds]="createPermissionIds()"
                  (selectionChange)="createPermissionIds.set($event)" />
              </div>
              <p class="hint">You can assign permissions after creating the role.</p>
              <p class="error-text" *ngIf="createError">{{ createError }}</p>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn ghost" (click)="closeCreateModal()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="submitCreate()" [disabled]="savingCreate || !newRole.name.trim()">
                <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1 15-5-5 1.5-1.5L11 13l5.5-5.5L18 9Z" fill="currentColor"/></svg>
                {{ savingCreate ? 'Creating...' : 'Create role' }}
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
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.12));
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
      color: var(--color-text-primary);
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--color-surface);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.12));
    }

    .btn-primary {
      background: linear-gradient(135deg, #E8BE14, #C98A0A);
      color: #0f0f12;
      border: none;
      box-shadow: 0 14px 28px rgba(232,190,20,0.35);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgba(232,190,20,0.45);
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      background: color-mix(in srgb, var(--color-error) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-error) 35%, transparent);
      color: var(--color-error);
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
      color: var(--color-text-primary);
      margin-bottom: 1.5rem;
    }

    .badge {
      background: var(--color-surface-hover);
      color: var(--color-text-secondary);
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
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.12));
    }

    .role-card:hover {
      box-shadow: var(--shadow-md, 0 8px 20px rgba(0,0,0,0.18));
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
      color: var(--color-text-primary);
      margin: 0;
    }

    .system-badge, .custom-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .system-badge {
      background: color-mix(in srgb, var(--color-info) 18%, transparent);
      color: color-mix(in srgb, var(--color-info) 80%, #0f172a 20%);
    }

    .custom-badge {
      background: color-mix(in srgb, var(--color-success) 18%, transparent);
      color: color-mix(in srgb, var(--color-success) 80%, #0f172a 20%);
    }

    .role-description {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .role-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
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
      color: var(--color-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
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
      color: var(--color-primary);
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem;
      transition: all 0.2s;
    }

    .btn-text:hover {
      color: color-mix(in srgb, var(--color-primary) 85%, var(--color-text-primary) 15%);
    }

    .btn-text.danger {
      color: var(--color-error);
    }

    .btn-text.danger:hover {
      color: color-mix(in srgb, var(--color-error) 85%, var(--color-text-primary) 15%);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--color-surface-hover);
      border: 2px dashed var(--color-border);
      border-radius: 12px;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.12));
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: var(--color-text-secondary);
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
      background: color-mix(in srgb, var(--color-surface) 85%, var(--color-surface-hover) 15%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05);
      color: var(--color-text-primary);
      backdrop-filter: blur(10px);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.2rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: relative;
    }

    .modal-header h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
    }

    .modal-subtitle {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .btn-close {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 1.4rem;
      color: var(--color-text-primary);
      cursor: pointer;
      padding: 0;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      transition: all 0.2s;
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }

    .btn-close:hover {
      background: rgba(232,190,20,0.12);
      color: #E8BE14;
      transform: translateY(-1px);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.1rem 1.25rem 1.25rem;
      background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 0.9rem 1.25rem 1.15rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: color-mix(in srgb, var(--color-surface-hover) 40%, transparent);
    }

    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-surface-hover);
    }

    .create-modal { max-width: 700px; }
    .themed-title { color: var(--color-text-primary); }
    .create-role-btn { padding: 0.8rem 1.6rem; border-radius: 14px; font-weight: 700; letter-spacing: 0.01em; gap: 0.6rem; }
    .create-role-btn svg { width: 20px; height: 20px; }
    .create-role-btn:active { transform: translateY(1px); box-shadow: 0 10px 18px rgba(232,190,20,0.3); }

    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-size: 12px; margin: 0 0 4px 0; }
    .btn.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: var(--color-text-primary); }
    .btn.ghost:hover { border-color: rgba(232,190,20,0.5); }

    .create-form label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      color: var(--color-text-primary);
      font-weight: 600;
    }
    .required { color: #E8BE14; }
    .pill-count { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 0.25rem 0.6rem; font-weight: 700; color: var(--color-text-primary); }

    .permission-selector {
      margin: 0.5rem 0 0;
      padding: 0.65rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
    }

    .create-form .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .create-form .field span { font-weight: 700; color: var(--color-text-secondary); }
    .create-form input,
    .create-form textarea {
      border: none;
      border-radius: 12px;
      padding: 0.8rem 0.95rem;
      background: #3E2D20;
      color: var(--color-text-primary);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.35);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }

    .create-form input:focus,
    .create-form textarea:focus {
      outline: none;
      border: 1px solid rgba(232,190,20,0.6);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 0 0 2px rgba(232,190,20,0.25);
      transform: translateY(-1px);
      background: #463426;
    }

    .create-form textarea { resize: vertical; }

    .create-form .fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .create-form .hint { color: #AB9F95; margin: 0.5rem 0 0; font-size: 0.9rem; }
    .error-text { color: var(--color-error); margin: 0.35rem 0 0; }
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
  // Create role modal
  showCreateDialog = signal(false);
  newRole = { name: '', description: '' };
  createPermissionIds = signal<string[]>([]);
  savingCreate = false;
  createError = '';

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

  openCreateModal() {
    this.createError = '';
    this.newRole = { name: '', description: '' };
    this.createPermissionIds.set([]);
    this.showCreateDialog.set(true);
  }

  closeCreateModal() {
    this.showCreateDialog.set(false);
  }

  submitCreate() {
    if (!this.newRole.name.trim()) {
      this.createError = 'Role name is required';
      return;
    }
    this.savingCreate = true;
    this.createError = '';
    const permissions = this.flattenPermissions(this.permissionTree()).filter(p => this.createPermissionIds().includes(p.id));

    this.roleService.createRole({
      name: this.newRole.name.trim(),
      description: this.newRole.description.trim(),
      permissions
    }).subscribe({
      next: () => {
        this.savingCreate = false;
        this.showCreateDialog.set(false);
        this.loadRoles();
      },
      error: (err) => {
        this.savingCreate = false;
        this.createError = err?.error?.message || 'Failed to create role';
      }
    });
  }

  private flattenPermissions(tree: Permission[]): Permission[] {
    const result: Permission[] = [];
    const walk = (nodes: Permission[]) => {
      for (const node of nodes) {
        result.push(node);
        if ((node as any).children?.length) {
          walk((node as any).children);
        }
      }
    };
    walk(tree);
    return result;
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
