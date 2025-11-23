import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, CreateUserDto, UpdateUserDto } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { Role } from '../../../../core/models/role.model';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="user-form-container">
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Edit User' : 'Create User' }}</h1>
        <p class="subtitle">{{ isEditMode() ? 'Update user details and role assignment' : 'Add a new user to the system' }}</p>
      </div>

      <div *ngIf="error()" class="error-banner">
        <span class="icon">⚠️</span>
        {{ error() }}
      </div>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
        <!-- Profile Picture -->
        <div class="profile-picture-section">
          <div class="profile-picture-preview">
            <div class="avatar-circle" [style.background-image]="profilePictureUrl() ? 'url(' + profilePictureUrl() + ')' : 'none'">
              <span *ngIf="!profilePictureUrl()" class="avatar-initials">{{ getInitials() }}</span>
            </div>
          </div>
          <div class="profile-picture-controls">
            <input
              #fileInput
              type="file"
              accept="image/*"
              (change)="onFileSelected($event)"
              style="display: none"
            />
            <button type="button" class="btn btn-secondary" (click)="fileInput.click()">
              📷 {{ profilePictureUrl() ? 'Change Photo' : 'Upload Photo' }}
            </button>
            <button
              *ngIf="profilePictureUrl()"
              type="button"
              class="btn btn-text-danger"
              (click)="removeProfilePicture()"
            >
              Remove
            </button>
            <p class="upload-hint">JPG, PNG or GIF (max 2MB)</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Name -->
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Enter full name"
              [class.error]="isFieldInvalid('name')"
            />
            <span *ngIf="isFieldInvalid('name')" class="error-message">
              Name is required
            </span>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="user@example.com"
              [class.error]="isFieldInvalid('email')"
            />
            <span *ngIf="isFieldInvalid('email')" class="error-message">
              Valid email is required
            </span>
          </div>

          <!-- Password (only for create) -->
          <div *ngIf="!isEditMode()" class="form-group">
            <label for="password">Password *</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Minimum 8 characters"
              [class.error]="isFieldInvalid('password')"
            />
            <span *ngIf="isFieldInvalid('password')" class="error-message">
              Password must be at least 8 characters
            </span>
          </div>

          <!-- Role -->
          <div class="form-group">
            <label for="roleId">Role</label>
            <select
              id="roleId"
              formControlName="roleId"
              [disabled]="loadingRoles()"
            >
              <option [value]="null">No role assigned</option>
              <option *ngFor="let role of roles()" [value]="role.id">
                {{ role.name }}
              </option>
            </select>
            <span class="field-hint">
              Users inherit permissions from their assigned role
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="userForm.invalid || saving()"
          >
            {{ saving() ? 'Saving...' : (isEditMode() ? 'Update User' : 'Create User') }}
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .user-form-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
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

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #fee 0%, #fdd 100%);
      border: 1px solid #fcc;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: #c33;
    }

    .user-form {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-picture-section {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .profile-picture-preview {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .avatar-initials {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
    }

    .profile-picture-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: #666;
      margin: 0;
    }

    .btn-text-danger {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .btn-text-danger:hover {
      color: #dc2626;
    }

    .form-grid {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.875rem;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input.error,
    .form-group select.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
    }

    .field-hint {
      color: #666;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class UserFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly userService = inject(UserService);
    private readonly roleService = inject(RoleService);

    userForm: FormGroup;
    roles = signal<Role[]>([]);
    loadingRoles = signal(false);
    saving = signal(false);
    error = signal<string | null>(null);
    isEditMode = signal(false);
    userId: string | null = null;
    profilePictureUrl = signal<string | null>(null);
    profilePictureFile: File | null = null;

    constructor() {
        this.userForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            roleId: [null]
        });
    }

    ngOnInit() {
        this.loadRoles();

        // Check if we're in edit mode
        this.userId = this.route.snapshot.paramMap.get('id');
        if (this.userId) {
            this.isEditMode.set(true);
            this.userForm.removeControl('password'); // Don't update password in edit mode
            this.loadUser(this.userId);
        }
    }

    loadRoles() {
        this.loadingRoles.set(true);
        this.roleService.getRoles().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.loadingRoles.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load roles');
                this.loadingRoles.set(false);
            }
        });
    }

    loadUser(id: string) {
        this.userService.getUser(id).subscribe({
            next: (user) => {
                this.userForm.patchValue({
                    name: user.name,
                    email: user.email,
                    roleId: user.roleId
                });
                if (user.profilePicture) {
                    this.profilePictureUrl.set(user.profilePicture);
                }
            },
            error: (err) => {
                this.error.set('Failed to load user');
            }
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.userForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getInitials(): string {
        const name = this.userForm.get('name')?.value || '';
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'U';
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                this.error.set('File size must be less than 2MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.error.set('Please select a valid image file');
                return;
            }

            this.profilePictureFile = file;

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.profilePictureUrl.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            this.error.set(null);
        }
    }

    removeProfilePicture(): void {
        this.profilePictureUrl.set(null);
        this.profilePictureFile = null;
    }

    onSubmit() {
        if (this.userForm.invalid) {
            Object.keys(this.userForm.controls).forEach(key => {
                this.userForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.saving.set(true);
        this.error.set(null);

        const formValue = this.userForm.value;

        if (this.isEditMode() && this.userId) {
            const updateDto: UpdateUserDto = {
                name: formValue.name,
                email: formValue.email,
                roleId: formValue.roleId || undefined,
                profilePicture: this.profilePictureUrl() || undefined
            };

            this.userService.updateUser(this.userId, updateDto).subscribe({
                next: () => {
                    this.router.navigate(['/setup/users']);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to update user');
                    this.saving.set(false);
                }
            });
        } else {
            const createDto: CreateUserDto = {
                name: formValue.name,
                email: formValue.email,
                password: formValue.password,
                roleId: formValue.roleId || undefined,
                profilePicture: this.profilePictureUrl() || undefined
            };

            this.userService.createUser(createDto).subscribe({
                next: () => {
                    this.router.navigate(['/setup/users']);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to create user');
                    this.saving.set(false);
                }
            });
        }
    }

    onCancel() {
        this.router.navigate(['/setup/users']);
    }
}
