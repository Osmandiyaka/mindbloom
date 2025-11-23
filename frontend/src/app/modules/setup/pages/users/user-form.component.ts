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
        <div class="form-with-avatar">
          <div class="form-grid">
            <!-- Name -->
            <div class="form-group">
              <label for="name">👤 Full Name *</label>
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
              <label for="email">📧 Email Address *</label>
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
              <label for="password">🔒 Password *</label>
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
              <label for="roleId">🎭 Role</label>
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

          <!-- Profile Picture -->
          <div class="profile-picture-section">
            <div class="profile-picture-preview">
              <div class="avatar-circle" [style.background-image]="profilePictureUrl() ? 'url(' + profilePictureUrl() + ')' : 'none'">
                <span *ngIf="!profilePictureUrl()" class="avatar-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100" height="100">
                    <!-- Background -->
                    <rect width="200" height="200" fill="#E8EBF0" rx="100"/>
                    <!-- Head -->
                    <ellipse cx="100" cy="75" rx="35" ry="38" fill="#ffffff"/>
                    <!-- Shoulders/Body -->
                    <path d="M 40 200 Q 45 140, 100 140 Q 155 140, 160 200 Z" fill="#ffffff"/>
                    <!-- Hair suggestion (top curve) -->
                    <path d="M 65 45 Q 70 35, 85 35 Q 100 30, 115 35 Q 130 35, 135 45" fill="#ffffff" opacity="0.7"/>
                  </svg>
                </span>
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
              <button type="button" class="btn btn-secondary btn-sm" (click)="fileInput.click()">
                📷 {{ profilePictureUrl() ? 'Change' : 'Upload' }}
              </button>
              <button
                *ngIf="profilePictureUrl()"
                type="button"
                class="btn btn-text-danger btn-sm"
                (click)="removeProfilePicture()"
              >
                🗑️ Remove
              </button>
              <p class="upload-hint">JPG, PNG or GIF (max 2MB)</p>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            ✕ Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="userForm.invalid || saving()"
          >
            {{ saving() ? '⏳ Saving...' : (isEditMode() ? '💾 Update User' : '✨ Create User') }}
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .user-form-container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.5s ease-out;
      position: relative;
    }

    .user-form-container::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      animation: float 6s ease-in-out infinite;
    }

    .page-header {
      margin-bottom: 3rem;
      text-align: center;
      position: relative;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 0.75rem 0;
      letter-spacing: -0.5px;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      margin: 0;
      font-size: 1.1rem;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 2px solid #fca5a5;
      border-radius: 12px;
      margin-bottom: 2rem;
      color: #dc2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      animation: fadeIn 0.3s ease-out;
    }

    .user-form {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 
        0 10px 40px rgba(0, 0, 0, 0.08),
        0 2px 8px rgba(0, 0, 0, 0.06);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(102, 126, 234, 0.1);
    }

    .user-form::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .form-with-avatar {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 2rem;
      align-items: start;
    }

    .profile-picture-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 16px;
      border: 2px dashed #e5e7eb;
      transition: all 0.3s ease;
    }

    .profile-picture-section:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    }

    .profile-picture-preview {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      box-shadow: 
        0 8px 24px rgba(102, 126, 234, 0.3),
        0 4px 12px rgba(118, 75, 162, 0.2);
      border: 4px solid white;
      position: relative;
      overflow: hidden;
    }

    .avatar-circle:hover {
      box-shadow: 
        0 12px 32px rgba(102, 126, 234, 0.4),
        0 6px 16px rgba(118, 75, 162, 0.3);
    }

    .avatar-initials {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      z-index: 1;
    }

    .avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #E8EBF0;
      border-radius: 50%;
    }

    .avatar-placeholder svg {
      display: block;
    }

    .profile-picture-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
      width: 100%;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: #9ca3af;
      margin: 0;
      text-align: center;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .upload-hint::before {
      content: 'ℹ️';
      font-size: 0.75rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      width: 100%;
    }

    .btn-text-danger {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-text-danger:hover {
      color: #dc2626;
      transform: translateX(2px);
    }

    .form-grid {
      display: grid;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      position: relative;
    }

    .form-group label {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s ease;
    }

    .form-group:focus-within label {
      color: #667eea;
    }

    .form-group input,
    .form-group select {
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #fafafa;
    }

    .form-group input:hover,
    .form-group select:hover {
      border-color: #d1d5db;
      background: white;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 
        0 0 0 4px rgba(102, 126, 234, 0.1),
        0 4px 12px rgba(102, 126, 234, 0.15);
      transform: translateY(-1px);
    }

    .form-group input.error,
    .form-group select.error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .form-group input.error:focus,
    .form-group select.error:focus {
      box-shadow: 
        0 0 0 4px rgba(239, 68, 68, 0.1),
        0 4px 12px rgba(239, 68, 68, 0.15);
    }

    .error-message {
      color: #ef4444;
      font-size: 0.813rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      animation: fadeIn 0.2s ease-out;
    }

    .error-message::before {
      content: '⚠️';
      font-size: 0.75rem;
    }

    .field-hint {
      color: #6b7280;
      font-size: 0.813rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .field-hint::before {
      content: '💡';
      font-size: 0.75rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      margin-top: 1rem;
      border-top: 2px solid #f3f4f6;
    }

    .btn {
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      font-size: 1rem;
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .btn:active::before {
      width: 300px;
      height: 300px;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      color: #4b5563;
      border: 2px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
      position: relative;
      overflow: hidden;
    }

    .btn-primary::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      bottom: -50%;
      left: -50%;
      background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.3) 0%, 
        transparent 50%, 
        rgba(0, 0, 0, 0.1) 100%);
      transform: rotateZ(45deg) translateY(100%);
      transition: transform 0.6s;
    }

    .btn-primary:hover::after {
      transform: rotateZ(45deg) translateY(-100%);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(102, 126, 234, 0.5),
        0 4px 12px rgba(118, 75, 162, 0.3);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
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
