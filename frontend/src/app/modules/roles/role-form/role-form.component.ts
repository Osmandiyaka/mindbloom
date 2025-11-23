import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { Permission } from '../../../core/models/role.model';
import { PermissionTreeComponent } from '../components/permission-tree/permission-tree.component';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, PermissionTreeComponent],
    templateUrl: './role-form.component.html',
    styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private roleService = inject(RoleService);

    isEditMode = signal(false);
    roleId = signal<string | null>(null);
    loading = signal(false);
    submitting = signal(false);
    error = signal<string | null>(null);

    permissionTree = this.roleService.permissionTree;
    selectedPermissions = signal<string[]>([]);

    roleForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]]
    });

    ngOnInit() {
        this.loadPermissionTree();

        // Check if editing existing role
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.roleId.set(id);
            this.loadRole(id);
        }
    }

    loadPermissionTree() {
        this.roleService.getPermissionTree().subscribe();
    }

    loadRole(id: string) {
        this.loading.set(true);
        this.roleService.getRoleById(id).subscribe({
            next: (role) => {
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description
                });

                // Set selected permissions
                const permissionIds = role.permissions.map(p => p.id);
                this.selectedPermissions.set(permissionIds);

                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load role');
                this.loading.set(false);
            }
        });
    }

    onPermissionsChange(permissionIds: string[]) {
        this.selectedPermissions.set(permissionIds);
    }

    onSubmit() {
        if (this.roleForm.invalid) {
            this.roleForm.markAllAsTouched();
            return;
        }

        if (this.selectedPermissions().length === 0) {
            alert('Please select at least one permission');
            return;
        }

        this.submitting.set(true);
        this.error.set(null);

        const formData = {
            ...this.roleForm.value,
            permissionIds: this.selectedPermissions()
        };

        const request = this.isEditMode()
            ? this.roleService.updateRole(this.roleId()!, formData)
            : this.roleService.createRole(formData);

        request.subscribe({
            next: () => {
                this.router.navigate(['/roles']);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to save role');
                this.submitting.set(false);
            }
        });
    }

    cancel() {
        this.router.navigate(['/roles']);
    }

    get nameControl() {
        return this.roleForm.get('name');
    }

    get descriptionControl() {
        return this.roleForm.get('description');
    }
}
