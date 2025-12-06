import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Permission, PermissionAction, PermissionScope } from '../../../../core/models/role.model';

interface ResourcePermission {
    resource: string;
    label: string;
    description: string;
    actions: {
        [key in PermissionAction]?: boolean;
    };
    scope: PermissionScope;
}

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
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
            <div *ngIf="roleForm.get('name')?.invalid && roleForm.get('name')?.touched" class="error-text">
              Role name is required
            </div>
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
            <div *ngIf="roleForm.get('description')?.invalid && roleForm.get('description')?.touched" class="error-text">
              Description is required
            </div>
          </div>
        </div>

        <!-- Permissions Matrix -->
        <div class="form-section">
          <h2>Permissions</h2>
          <p class="section-subtitle">Select which resources this role can access and what actions they can perform</p>

          <div class="permissions-matrix">
            <!-- Table Header -->
            <div class="matrix-header">
              <div class="resource-col">Resource</div>
              <div class="action-col">Create</div>
              <div class="action-col">Read</div>
              <div class="action-col">Update</div>
              <div class="action-col">Delete</div>
              <div class="scope-col">Scope</div>
            </div>

            <!-- Permission Rows -->
            <div *ngFor="let resource of availableResources()" class="matrix-row">
              <div class="resource-col">
                <div class="resource-info">
                  <strong>{{ resource.label }}</strong>
                  <span class="resource-desc">{{ resource.description }}</span>
                </div>
              </div>
              
              <div class="action-col">
                <input 
                  type="checkbox" 
                  [checked]="resource.actions[PermissionAction.CREATE]"
                  (change)="toggleAction(resource, PermissionAction.CREATE)"
                  class="checkbox"
                />
              </div>
              
              <div class="action-col">
                <input 
                  type="checkbox" 
                  [checked]="resource.actions[PermissionAction.READ]"
                  (change)="toggleAction(resource, PermissionAction.READ)"
                  class="checkbox"
                />
              </div>
              
              <div class="action-col">
                <input 
                  type="checkbox" 
                  [checked]="resource.actions[PermissionAction.UPDATE]"
                  (change)="toggleAction(resource, PermissionAction.UPDATE)"
                  class="checkbox"
                />
              </div>
              
              <div class="action-col">
                <input 
                  type="checkbox" 
                  [checked]="resource.actions[PermissionAction.DELETE]"
                  (change)="toggleAction(resource, PermissionAction.DELETE)"
                  class="checkbox"
                />
              </div>
              
              <div class="scope-col">
                <select 
                  [value]="resource.scope"
                  (change)="changeScope(resource, $event)"
                  class="scope-select"
                >
                  <option [value]="PermissionScope.OWN">Own Only</option>
                  <option [value]="PermissionScope.DEPARTMENT">Department</option>
                  <option [value]="PermissionScope.ALL">All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="roleForm.invalid || saving()">
            <span *ngIf="!saving()">{{ isEditMode() ? 'Update Role' : 'Create Role' }}</span>
            <span *ngIf="saving()">Saving...</span>
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .role-form-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: #6B7280;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
      display: inline-block;
    }

    .btn-back:hover {
      color: #3B82F6;
    }

    h1 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
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

    .form-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .section-subtitle {
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
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
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .error-text {
      color: #EF4444;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .permissions-matrix {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      overflow: hidden;
    }

    .matrix-header, .matrix-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .matrix-header {
      background: #F3F4F6;
      border-bottom: 2px solid #E5E7EB;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6B7280;
    }

    .matrix-row {
      background: white;
      border-bottom: 1px solid #E5E7EB;
    }

    .matrix-row:last-child {
      border-bottom: none;
    }

    .matrix-row:hover {
      background: #F9FAFB;
    }

    .resource-info strong {
      display: block;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .resource-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .action-col {
      text-align: center;
    }

    .checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #3B82F6;
    }

    .scope-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .scope-select:focus {
      outline: none;
      border-color: #3B82F6;
    }

    .form-actions {
      padding: 2rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      border: 1px solid #D1D5DB;
      color: var(--text-primary);
    }

    .btn-secondary:hover:not(:disabled) {
      background: #F9FAFB;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  `]
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    roleService = inject(RoleService);

    roleForm: FormGroup;
    isEditMode = signal(false);
    saving = signal(false);
    roleId: string | null = null;

    // Expose enums to template
    PermissionAction = PermissionAction;
    PermissionScope = PermissionScope;

    availableResources = signal<ResourcePermission[]>([
        {
            resource: 'students',
            label: 'Students',
            description: 'Student information and records',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'staff',
            label: 'Staff',
            description: 'Staff and teacher management',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'academics',
            label: 'Academics',
            description: 'Classes, subjects, and curriculum',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'attendance',
            label: 'Attendance',
            description: 'Attendance tracking and reports',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'exams',
            label: 'Exams',
            description: 'Exams and assessments',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'grades',
            label: 'Grades',
            description: 'Grade entry and gradebook',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'fees',
            label: 'Fees',
            description: 'Fee management and billing',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'payments',
            label: 'Payments',
            description: 'Payment collection and processing',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'library',
            label: 'Library',
            description: 'Library and book management',
            actions: {},
            scope: PermissionScope.ALL
        },
        {
            resource: 'reports',
            label: 'Reports',
            description: 'Reports and analytics',
            actions: {},
            scope: PermissionScope.ALL
        }
    ]);

    constructor() {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.roleId = this.route.snapshot.paramMap.get('id');
        if (this.roleId) {
            this.isEditMode.set(true);
            this.loadRole(this.roleId);
        }
    }

    loadRole(id: string) {
        this.roleService.getRoleById(id).subscribe({
            next: (role) => {
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description
                });

                // Map permissions to resource matrix
                role.permissions.forEach(perm => {
                    const resource = this.availableResources().find(r => r.resource === perm.resource);
                    if (resource) {
                        perm.actions.forEach(action => {
                            resource.actions[action] = true;
                        });
                        resource.scope = perm.scope;
                    }
                });
            }
        });
    }

    toggleAction(resource: ResourcePermission, action: PermissionAction) {
        resource.actions[action] = !resource.actions[action];
    }

    changeScope(resource: ResourcePermission, event: any) {
        resource.scope = event.target.value as PermissionScope;
    }

    getPermissions(): Permission[] {
        return this.availableResources()
            .filter(r => Object.values(r.actions).some(v => v))
            .map(r => ({
                id: r.resource,
                resource: r.resource,
                displayName: r.resource,
                actions: Object.entries(r.actions)
                    .filter(([_, enabled]) => enabled)
                    .map(([action]) => action as PermissionAction),
                scope: r.scope
            }));
    }

    onSubmit() {
        if (this.roleForm.invalid) return;

        const permissions = this.getPermissions();
        if (permissions.length === 0) {
            alert('Please select at least one permission');
            return;
        }

        const dto = {
            name: this.roleForm.value.name,
            description: this.roleForm.value.description,
            permissions
        };

        this.saving.set(true);

        const request = this.isEditMode() && this.roleId
            ? this.roleService.updateRole(this.roleId, dto)
            : this.roleService.createRole(dto);

        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.router.navigate(['/setup/roles']);
            },
            error: (err) => {
                this.saving.set(false);
                alert(`Failed to save role: ${err.message}`);
            }
        });
    }

    goBack() {
        this.router.navigate(['/setup/roles']);
    }
}
