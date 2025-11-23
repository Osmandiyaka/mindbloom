import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Permission } from '../../../../core/models/role.model';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, PermissionTreeSelectorComponent],
    template: `
    <div class="role-form-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          ← Back to Roles
        </button>
        <h1>{{ isEditMode() ? 'Edit Role' : 'Create Custom Role' }}</h1>
      </div>

      <!-- Form -->
      <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="role-form">
        <!-- Basic Info -->
        <div class="form-section">
          <h2>Basic Information</h2>
          
          <div class="form-group">
            <label for="name">Role Name *</label>
            <input 
              id="name"
              type="text" 
              formControlName="name" 
              placeholder="e.g., Exam Coordinator"
              class="form-input"
            />
            @if (roleForm.get('name')?.invalid && roleForm.get('name')?.touched) {
              <div class="error-text">Role name is required</div>
            }
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description"
              formControlName="description" 
              placeholder="Describe this role's responsibilities..."
              rows="3"
              class="form-input"
            ></textarea>
            @if (roleForm.get('description')?.invalid && roleForm.get('description')?.touched) {
              <div class="error-text">Description is required</div>
            }
          </div>
        </div>

        <!-- Permissions Tree -->
        <div class="form-section">
          <div class="section-header">
            <div>
              <h2>Permissions</h2>
              <p class="section-subtitle">Select which permissions this role should have</p>
            </div>
            <button type="button" class="btn btn-secondary" (click)="showPermissionSelector()">
              <span class="btn-icon">+</span>
              Add Permissions
            </button>
          </div>

          @if (selectedPermissions().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">🔐</span>
              <p>No permissions selected</p>
              <p class="empty-hint">Click "Add Permissions" to grant access</p>
            </div>
          } @else {
            <div class="selected-permissions-list">
              @for (permission of selectedPermissions(); track permission.id) {
                <div class="permission-chip">
                  <span class="chip-icon">{{ permission.icon || '📄' }}</span>
                  <div class="chip-content">
                    <span class="chip-name">{{ permission.displayName }}</span>
                    <span class="chip-meta">
                      {{ permission.actions.join(', ') }} • {{ permission.scope }}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    class="chip-remove" 
                    (click)="removePermission(permission.id)"
                  >
                    ×
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="roleForm.invalid || saving()">
            @if (!saving()) {
              <span>{{ isEditMode() ? 'Update Role' : 'Create Role' }}</span>
            } @else {
              <span>Saving...</span>
            }
          </button>
        </div>
      </form>

      <!-- Permission Selector Modal -->
      @if (showPermissionDialog()) {
        <div class="modal-overlay" (click)="closePermissionSelector()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Select Permissions</h2>
              <button type="button" class="btn-close" (click)="closePermissionSelector()">×</button>
            </div>
            
            <div class="modal-body">
              <app-permission-tree-selector
                [permissions]="permissionTree()"
                [selectedPermissionIds]="selectedPermissionIds()"
                (selectionChange)="onPermissionSelectionChange($event)"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closePermissionSelector()">
                Cancel
              </button>
              <button type="button" class="btn btn-primary" (click)="applyPermissionSelection()">
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .role-form-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: #3B82F6;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.5rem 0;
      margin-bottom: 1rem;
      display: block;
    }

    .btn-back:hover {
      text-decoration: underline;
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .role-form {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-section {
      padding: 2rem;
      border-bottom: 1px solid #E5E7EB;
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .section-subtitle {
      color: #6B7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea.form-input {
      resize: vertical;
      font-family: inherit;
    }

    .error-text {
      color: #DC2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .btn-icon {
      margin-right: 0.5rem;
      font-size: 1.125rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #F9FAFB;
      border-radius: 8px;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state p {
      margin: 0.25rem 0;
      color: #6B7280;
    }

    .empty-hint {
      font-size: 0.875rem;
    }

    .selected-permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .permission-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #F3F4F6;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 0.75rem;
      transition: all 0.2s;
    }

    .permission-chip:hover {
      background: #E5E7EB;
    }

    .chip-icon {
      font-size: 1.25rem;
    }

    .chip-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1;
    }

    .chip-name {
      font-weight: 500;
      color: #111827;
      font-size: 0.875rem;
    }

    .chip-meta {
      font-size: 0.75rem;
      color: #6B7280;
    }

    .chip-remove {
      background: none;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      font-size: 1.5rem;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .chip-remove:hover {
      background: #DC2626;
      color: white;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      border-radius: 0 0 12px 12px;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563EB;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
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
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #E5E7EB;
    }

    .modal-header h2 {
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
  `]
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private roleService = inject(RoleService);

    // State
    roleForm!: FormGroup;
    isEditMode = signal(false);
    saving = signal(false);
    roleId = signal<string | null>(null);
    
    // Permission tree state
    permissionTree = signal<Permission[]>([]);
    selectedPermissionIds = signal<string[]>([]);
    selectedPermissions = signal<Permission[]>([]);
    showPermissionDialog = signal(false);
    tempSelectedIds = signal<string[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadPermissionTree();
        this.checkEditMode();
    }

    private initForm() {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
        });
    }

    private loadPermissionTree() {
        this.roleService.getPermissionTree().subscribe({
            next: (tree) => {
                this.permissionTree.set(tree);
            },
            error: (err) => {
                console.error('Failed to load permission tree:', err);
            }
        });
    }

    private checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.roleId.set(id);
            this.loadRole(id);
        }
    }

    private loadRole(id: string) {
        this.roleService.getRoleById(id).subscribe({
            next: (role) => {
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description,
                });
                
                // Extract permission IDs and find full permission objects
                const permissionIds = role.permissions.map(p => p.id);
                this.selectedPermissionIds.set(permissionIds);
                this.updateSelectedPermissions(permissionIds);
            },
            error: (err) => {
                console.error('Failed to load role:', err);
            }
        });
    }

    private updateSelectedPermissions(permissionIds: string[]) {
        const flatPermissions = this.flattenPermissionTree(this.permissionTree());
        const selected = flatPermissions.filter(p => permissionIds.includes(p.id));
        this.selectedPermissions.set(selected);
    }

    private flattenPermissionTree(tree: Permission[]): Permission[] {
        const flat: Permission[] = [];
        for (const permission of tree) {
            flat.push(permission);
            if (permission.children) {
                flat.push(...this.flattenPermissionTree(permission.children));
            }
        }
        return flat;
    }

    showPermissionSelector() {
        this.tempSelectedIds.set([...this.selectedPermissionIds()]);
        this.showPermissionDialog.set(true);
    }

    closePermissionSelector() {
        this.showPermissionDialog.set(false);
        this.tempSelectedIds.set([]);
    }

    onPermissionSelectionChange(selectedIds: string[]) {
        this.tempSelectedIds.set(selectedIds);
    }

    applyPermissionSelection() {
        this.selectedPermissionIds.set([...this.tempSelectedIds()]);
        this.updateSelectedPermissions(this.tempSelectedIds());
        this.closePermissionSelector();
    }

    removePermission(permissionId: string) {
        const newIds = this.selectedPermissionIds().filter(id => id !== permissionId);
        this.selectedPermissionIds.set(newIds);
        this.updateSelectedPermissions(newIds);
    }

    onSubmit() {
        if (this.roleForm.invalid) {
            Object.keys(this.roleForm.controls).forEach(key => {
                this.roleForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.saving.set(true);

        const flatPermissions = this.flattenPermissionTree(this.permissionTree());
        const selectedPerms = flatPermissions.filter(p => 
            this.selectedPermissionIds().includes(p.id)
        );

        const dto = {
            name: this.roleForm.value.name,
            description: this.roleForm.value.description,
            permissions: selectedPerms,
        };

        const action = this.isEditMode()
            ? this.roleService.updateRole(this.roleId()!, dto)
            : this.roleService.createRole(dto);

        action.subscribe({
            next: () => {
                this.saving.set(false);
                this.router.navigate(['/setup/roles']);
            },
            error: (err) => {
                console.error('Failed to save role:', err);
                this.saving.set(false);
            }
        });
    }

    goBack() {
        this.router.navigate(['/setup/roles']);
    }
}
