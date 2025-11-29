import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { InvitationService, Invitation } from '../../../../core/services/invitation.service';
import { SubscriptionService, Subscription, SubscriptionPlan } from '../../../../core/services/subscription.service';
import { PluginLauncherComponent } from '../../../plugins/pages/plugin-launcher/plugin-launcher.component';
import { RouterModule } from '@angular/router';
import { Tenant } from '../../../../core/services/tenant.service';
import { RoleSelectorComponent } from '../../../../shared/components/role-selector/role-selector.component';
import { Role } from '../../../../core/models/role.model';
import { UserService, User } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';

@Component({
    selector: 'app-tenant-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, PluginLauncherComponent, RouterModule, RoleSelectorComponent, PermissionTreeSelectorComponent],
    template: `
    <div class="tenant-settings compact">

      <div class="tabs">
        <button [class.active]="activeTab === 'branding'" (click)="activeTab = 'branding'">Branding & Locale</button>
        <button [class.active]="activeTab === 'invitations'" (click)="activeTab = 'invitations'">Invitations</button>
        <button [class.active]="activeTab === 'users'" (click)="openUsersTab()">Users</button>
        <button [class.active]="activeTab === 'billing'" (click)="activeTab = 'billing'">Billing & Subscription</button>
        <button [class.active]="activeTab === 'plugins'" (click)="activeTab = 'plugins'">Plugins</button>
      </div>

      <ng-container [ngSwitch]="activeTab">
        <div *ngSwitchCase="'branding'">
          <div class="grid">
            <div class="card">
              <div class="card-header">
                <h2>Brand</h2>
                <p>Logo and color palette reflected in the app chrome.</p>
              </div>
              <div class="card-body form-grid">
                <label>
                  <span>Logo URL</span>
                  <input type="text" [(ngModel)]="draft.customization!.logo" placeholder="https://yourcdn/logo.png" />
                </label>
                <div class="color-row">
                  <label><span>Primary Color</span><input type="color" [(ngModel)]="draft.customization!.primaryColor" /></label>
                  <label><span>Secondary Color</span><input type="color" [(ngModel)]="draft.customization!.secondaryColor" /></label>
                  <label><span>Accent Color</span><input type="color" [(ngModel)]="draft.customization!.accentColor" /></label>
                </div>
                <div class="logo-preview" *ngIf="draft.customization?.logo">
                  <span>Preview</span>
                  <img [src]="draft.customization!.logo" alt="Logo preview" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2>Locale & Time</h2>
                <p>Defaults for dates, weeks, and currency across your tenant.</p>
              </div>
              <div class="card-body form-grid">
                <label><span>Locale</span><input type="text" [(ngModel)]="draft.locale" placeholder="en-US" /></label>
                <label><span>Timezone</span><input type="text" [(ngModel)]="draft.timezone" placeholder="America/New_York" /></label>
                <label><span>Week Starts On</span>
                  <select [(ngModel)]="draft.weekStartsOn">
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </label>
                <label><span>Currency</span><input type="text" [(ngModel)]="draft.currency" placeholder="USD" /></label>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2>Academic Calendar</h2>
                <p>Set start and end dates for reporting and scheduling.</p>
              </div>
              <div class="card-body form-grid">
                <label><span>Academic Year Start</span><input type="date" [(ngModel)]="draft.academicYear!.start" /></label>
                <label><span>Academic Year End</span><input type="date" [(ngModel)]="draft.academicYear!.end" /></label>
              </div>
            </div>
          </div>
          <div class="actions sticky-actions">
            <div class="spacer"></div>
            <div class="action-buttons">
              <button class="btn ghost" (click)="reset()" [disabled]="loading()">Reset</button>
              <button class="btn primary" (click)="save()" [disabled]="loading() || saving()">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'invitations'" class="panel invitations-panel">
          <div class="panel-header stacked slim">
            <div>
              <h2>User Invitations</h2>
              <p class="subtitle">Invite staff or partners with roles. Invitations auto-expire in 7 days by default.</p>
            </div>
          </div>
          <div class="card invites-card tight">
            <div class="invite-row compact">
              <div class="input-icon">
                <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.51l8 5.33 8-5.33V6H4Zm0 3.36V18h16V9.36l-7.47 4.98a2 2 0 0 1-2.06 0L4 9.36Z" fill="currentColor"/></svg>
                <input type="email" [(ngModel)]="inviteEmail" placeholder="user@school.com" />
              </div>
              <app-role-selector
                [selectedRoleIds]="selectedRoleIds()"
                (selectionChange)="onRoleSelection($event)" />
              <button class="btn primary" (click)="sendInvite()" [disabled]="inviteLoading()">
                <svg viewBox="0 0 24 24"><path d="m3.4 21 18.3-9L3.4 3v6.5l13.1 2-13.1 2V21Z" fill="currentColor"/></svg>
                {{ inviteLoading() ? 'Sending...' : 'Send Invite' }}
              </button>
            </div>
            <div class="selected-roles" *ngIf="selectedRoles().length">
              <span *ngFor="let r of selectedRoles()" class="chip">
                <svg viewBox="0 0 24 24"><path d="M9.5 17 5 12.5l1.5-1.5L9.5 14l8-8 1.5 1.5-9.5 9.5Z" fill="currentColor"/></svg>
                {{ r.name }}
              </span>
            </div>
            <div class="card-body tight-body">
              <table class="table invites">
                <thead>
                  <tr><th>Email</th><th>Roles</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of invitations()">
                    <td class="email-cell">
                      <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.51l8 5.33 8-5.33V6H4Zm0 3.36V18h16V9.36l-7.47 4.98a2 2 0 0 1-2.06 0L4 9.36Z" fill="currentColor"/></svg>
                      {{ inv.email }}
                    </td>
                    <td><span class="pill neutral">{{ inv.roles.join(', ') || '—' }}</span></td>
                    <td><span class="badge" [class.revoked]="inv.status === 'revoked'">{{ inv.status }}</span></td>
                    <td>{{ inv.expiresAt | date:'mediumDate' }}</td>
                    <td class="actions">
                      <button class="btn ghost small" (click)="resend(inv); $event.stopPropagation()">
                        <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 8 8v-2.5l4 3.5-4 3.5V18a6 6 0 1 0-6-6H4Z" fill="currentColor"/></svg>
                        Resend
                      </button>
                      <button class="btn ghost small danger" (click)="revoke(inv); $event.stopPropagation()">
                        <svg viewBox="0 0 24 24"><path d="M6 6h12l-1 14H7L6 6Zm2-4h8l1 4H7l1-4Zm2 8h2v6h-2v-6Zm4 0h2v6h-2v-6Z" fill="currentColor"/></svg>
                        Revoke
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!invitations().length" class="muted">No invitations yet.</p>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'users'" class="panel users-panel">
          <div class="panel-header spaced padded">
            <div class="stacked">
              <h2>Tenant Users</h2>
              <p class="subtitle">Create and manage tenant users with roles.</p>
            </div>
            <button class="btn primary" (click)="openUserModal()">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm7-3h-2v-2h-2V7h2V5h2v2h2v2h-2v2Z" fill="currentColor"/></svg>
              Add User
            </button>
          </div>
          <div class="card invites-card tight users-card">
            <div class="card-body toolbar">
              <div class="left">
                <span class="selected-count" *ngIf="selectedUserIds().size">{{ selectedUserIds().size }} selected</span>
              </div>
              <div class="actions">
                <button class="btn ghost small" [disabled]="!selectedUserIds().size" (click)="bulkDelete()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                    <path d="M10 10v6" />
                    <path d="M14 10v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Bulk Delete
                </button>
                <button class="btn primary small" [disabled]="!selectedUserIds().size" (click)="openPermissionModal()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Assign Permissions
                </button>
              </div>
            </div>
            <div class="card-body tight-body">
              <table class="table invites">
                <thead>
                  <tr><th style="width:48px;"><input type="checkbox" [checked]="selectAllUsers()" (change)="toggleSelectAll($event)" /></th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of users()">
                    <td><input type="checkbox" [checked]="selectedUserIds().has(user.id)" (change)="toggleUserSelection(user)" /></td>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.role?.name || '—' }}</td>
                    <td>{{ user.createdAt | date:'mediumDate' }}</td>
                    <td class="actions">
                      <button class="btn ghost small" (click)="openUserModal(user)">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!users().length" class="muted">No users yet.</p>
            </div>
          </div>

          <div class="overlay" *ngIf="showUserModal()">
            <div class="modal users-modal">
              <header class="modal-header">
                <div>
                  <p class="eyebrow">User</p>
                  <h2>{{ editingUser() ? 'Edit User' : 'Add User' }}</h2>
                </div>
                <button class="icon-btn" (click)="closeUserModal()" aria-label="Close">
                  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M6 18 18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </header>
              <div class="modal-body user-form">
                <div class="field">
                  <label>Name</label>
                  <input type="text" [(ngModel)]="userForm.name" placeholder="Jane Doe" />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="userForm.email" placeholder="user@school.com" />
                </div>
                <div class="field password-field" *ngIf="!editingUser()">
                  <label>Password</label>
                  <div class="password-row">
                    <input type="text" [(ngModel)]="userForm.password" placeholder="Minimum 8 characters" />
                    <button class="btn ghost small" type="button" (click)="generatePassword()">Generate</button>
                  </div>
                  <p class="hint">Generate a strong random password or enter your own.</p>
                </div>
                <div class="field">
                  <label>Roles</label>
                  <app-role-selector
                    [selectedRoleIds]="userRoleIds()"
                    (selectionChange)="setUserRoles($event)" />
                  <div class="selected-roles" *ngIf="userRoles().length">
                    <span *ngFor="let r of userRoles()" class="chip">
                      <svg viewBox="0 0 24 24"><path d="M9.5 17 5 12.5l1.5-1.5L9.5 14l8-8 1.5 1.5-9.5 9.5Z" fill="currentColor"/></svg>
                      {{ r.name }}
                    </span>
                  </div>
                </div>
                <div class="field inline-toggles">
                  <label>Security</label>
                  <label class="toggle"><input type="checkbox" [(ngModel)]="userForm.forcePasswordReset" /> <span>Force password reset on first login</span></label>
                  <label class="toggle"><input type="checkbox" [(ngModel)]="userForm.mfaEnabled" /> <span>Require MFA</span></label>
                </div>
              </div>
              <footer class="modal-footer">
                <button class="ghost" (click)="closeUserModal()">Cancel</button>
                <button class="primary" (click)="saveUser()" [disabled]="userSaving()">
                  {{ userSaving() ? 'Saving...' : 'Save User' }}
                </button>
              </footer>
            </div>
          </div>

          <div class="overlay" *ngIf="showPermissionModal()">
            <div class="modal users-modal">
              <header class="modal-header">
                <div>
                  <p class="eyebrow">Permissions</p>
                  <h2>Assign permissions to users ({{ selectedUserIds().size }})</h2>
                </div>
                <button class="icon-btn" (click)="closePermissionModal()" aria-label="Close">
                  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M6 18 18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </header>
              <div class="modal-body">
                <app-permission-tree-selector
                  [permissions]="roleService.permissionTree()"
                  [selectedPermissionIds]="selectedPermissionIds()"
                  (selectionChange)="selectedPermissionIds.set($event)"
                />
              </div>
              <footer class="modal-footer">
                <button class="ghost" (click)="closePermissionModal()">Cancel</button>
                <button class="primary" (click)="assignPermissions()" [disabled]="!selectedPermissionIds().length">
                  Assign to {{ selectedUserIds().size }} user(s)
                </button>
              </footer>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'billing'" class="panel billing-panel">
          <div class="panel-header spaced">
            <div class="stacked">
              <h2>Subscription</h2>
              <p class="subtitle">Current plan: {{ subscription()?.plan || 'free' }} • Status: {{ subscription()?.status }}</p>
            </div>
          </div>
          <div class="plans padded">
            <div *ngFor="let plan of plans" class="plan-card" [class.active]="subscription()?.plan === plan.id">
              <div class="plan-head">
                <h3>{{ plan.label }}</h3>
                <p class="price">{{ plan.price }}</p>
              </div>
              <ul>
                <li *ngFor="let perk of plan.perks">{{ perk }}</li>
              </ul>
              <div class="plan-footer">
                <button class="btn primary" (click)="changePlan(plan.id)" [disabled]="billingLoading() || subscription()?.plan === plan.id">
                  {{ subscription()?.plan === plan.id ? 'Current Plan' : 'Switch' }}
                </button>
              </div>
            </div>
          </div>
          <div class="card padded">
            <div class="card-header">
              <h3>Invoices</h3>
            </div>
            <div class="card-body">
              <table class="table">
                <thead><tr><th>ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  <tr *ngFor="let inv of subscription()?.invoices || []">
                    <td>{{ inv.id }}</td>
                    <td>{{ inv.amount | currency:inv.currency }}</td>
                    <td>{{ inv.status }}</td>
                    <td>{{ inv.createdAt | date:'mediumDate' }}</td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!subscription()?.invoices?.length" class="muted">No invoices yet.</p>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'plugins'" class="panel plugins-panel">
          <div class="panel-header padded">
            <div class="stacked">
              <h2>Plugins</h2>
              <p class="subtitle">Manage installed extensions or browse the marketplace.</p>
            </div>
            <div class="actions">
              <a routerLink="/setup/marketplace" class="btn ghost">Open Marketplace</a>
            </div>
          </div>
          <div class="card padded plugin-card">
            <div class="card-body plugin-body">
              <app-plugin-launcher />
            </div>
          </div>
        </div>
      </ng-container>

      <div class="alert" *ngIf="error()"><span>{{ error() }}</span></div>
      <div class="alert success" *ngIf="success()"><span>{{ success() }}</span></div>
    </div>
  `,
    styles: [`
    .tenant-settings { max-width: 1200px; margin: 0 auto; padding: 0.75rem 1.25rem 1.25rem; background: var(--content-background, var(--color-background)); color: var(--color-text-primary); }
    .tenant-settings.compact { padding-top: 0.5rem; }
    .page-header { margin-bottom: 0; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-size: 12px; margin: 0 0 4px 0; }
    h1 { margin: 0; }
    .subtitle { margin: 4px 0 0 0; color: var(--color-text-secondary); }
    .tabs { display: flex; gap: 0.5rem; margin: 1rem 0 1.5rem 0; flex-wrap: wrap; }
    .tabs button { padding: 0.65rem 1rem; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; transition: all 0.2s ease; color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
    .tabs button:hover { border-color: var(--color-border-light); box-shadow: var(--shadow-md); }
    .tabs button.active { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; border: none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb, 123, 140, 255), 0.3); }
    .actions { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .actions.sticky-actions { justify-content: flex-end; margin-top: 0.75rem; padding-right: 0.25rem; }
    .actions.sticky-actions .action-buttons { display: flex; gap: 0.75rem; }
    .actions.sticky-actions .spacer { flex: 1; }
    .btn { padding: 0.65rem 1.25rem; border-radius: 10px; border: 1px solid var(--color-border); cursor: pointer; background: var(--color-surface); color: var(--color-text-primary); transition: all 0.2s ease; box-shadow: var(--shadow-sm); display: inline-flex; align-items: center; gap: 0.4rem; }
    .btn svg { width: 18px; height: 18px; }
    .btn.ghost { background: var(--color-surface); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; border: none; box-shadow: var(--shadow-md); }
    .btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .btn:active { transform: translateY(0); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; }
    .card.padded { padding: 0.35rem 0.35rem 0.75rem; }
    .card-header { padding: 1.25rem 1.25rem 0.5rem 1.25rem; }
    .card-body { padding: 0 1.25rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--color-text-secondary); }
    input, select { padding: 0.65rem 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-background); color: var(--color-text-primary); transition: all 0.2s ease; }
    input:focus, select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,123,140,255),0.18); background: var(--color-surface); }
    .color-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap: 0.75rem; }
    .logo-preview { display: flex; flex-direction: column; gap: 0.5rem; }
    .logo-preview img { max-height: 80px; max-width: 200px; object-fit: contain; border: 1px dashed var(--color-border); padding: 6px; border-radius: 8px; }
    .alert { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(var(--color-error-rgb,239,68,68),0.08); color: var(--color-error); }
    .alert.success { background: rgba(var(--color-success-rgb,16,185,129),0.08); color: var(--color-success); }
    .panel { display: flex; flex-direction: column; gap: 0.75rem; }
    .invitations-panel { max-width: 1100px; gap: 0.25rem; }
    .plugins-panel { max-width: 1100px; gap: 0.35rem; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .panel-header.stacked { flex-direction: column; align-items: stretch; }
    .panel-header.slim { margin-bottom: 0.25rem; padding: 0 0.75rem; }
    .panel-header.spaced { padding: 0 0.75rem; }
    .panel-header.padded { padding: 0 0.75rem; }
    .invite-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; padding: 1rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.75rem; }
    .invite-card.flat { box-shadow: none; border-radius: 12px; border-color: var(--color-border); }
    .invite-row { display: grid; grid-template-columns: 1.2fr auto auto; gap: 0.5rem; align-items: center; }
    .invite-row.compact { margin-bottom: 0.25rem; }
    .input-icon { display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.75rem; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-background); }
    .input-icon svg { width: 18px; height: 18px; color: var(--color-text-tertiary); }
    .input-icon input { border: none; outline: none; background: transparent; width: 100%; color: var(--color-text-primary); }
    .selected-roles { display: flex; gap: 6px; flex-wrap: wrap; }
    .selected-roles .chip { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.12); color: var(--color-primary); padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(16,185,129,0.25); font-weight: 700; }
    .selected-roles .chip svg { width: 14px; height: 14px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 0.65rem; border-bottom: 1px solid var(--color-border); text-align: left; }
    .table th { color: var(--color-text-tertiary); font-weight: 600; font-size: 0.9rem; }
    .table.invites th, .table.invites td { padding: 0.45rem 0.65rem; line-height: 1.2; vertical-align: middle; }
    .table.invites td.email-cell { display: flex; align-items: center; gap: 0.4rem; }
    .table.invites td.email-cell svg { width: 18px; height: 18px; flex-shrink: 0; }
    .user-form { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.5rem 0.75rem 1rem; background: var(--color-surface); border-radius: 12px; border: 1px solid var(--color-border); }
    .user-form .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .user-form label { font-weight: 700; color: var(--color-text-secondary); font-size: 0.9rem; }
    .user-form input, .user-form select { width: 100%; padding: 0.65rem 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-background); color: var(--color-text-primary); transition: all 0.18s ease; }
    .user-form input:focus, .user-form select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,123,140,255),0.18); background: var(--color-surface); }
    .password-row { display: flex; gap: 0.5rem; align-items: center; }
    .password-row input { flex: 1; }
    .password-row .btn { padding: 0.55rem 0.9rem; }
    .hint { margin: 0; color: var(--color-text-tertiary); font-size: 0.85rem; }
    .inline-toggles { gap: 0.35rem !important; }
    .inline-toggles .toggle { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; color: var(--color-text-secondary); padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); }
    .inline-toggles .toggle input { appearance: none; width: 18px; height: 18px; border: 2px solid var(--color-border); border-radius: 6px; background: var(--color-background); transition: all 0.15s ease; display: inline-flex; align-items: center; justify-content: center; position: relative; }
    .inline-toggles .toggle input:checked { border-color: var(--color-primary); background: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,123,140,255),0.15); }
    .inline-toggles .toggle input:checked::after { content: '✓'; color: #fff; font-weight: 700; font-size: 12px; line-height: 1; position: absolute; }
    .user-form .selected-roles { margin-top: 0.25rem; }
    .muted { color: var(--color-text-tertiary); }
    .badge { padding: 0.2rem 0.6rem; border-radius: 999px; background: var(--color-surface-hover); }
    .badge.revoked { background: rgba(var(--color-error-rgb,239,68,68),0.1); color: var(--color-error); }
    .actions .btn { padding: 0.4rem 0.7rem; }
    .btn.small { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
    .btn.danger { color: var(--color-error); }
    .plans { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1rem; }
    .plans.padded { padding: 0.5rem; }
    .plan-card { border: 1px solid var(--color-border); border-radius: 14px; padding: 1rem; background: var(--color-surface); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.75rem; }
    .plan-card.active { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,102,126,234),0.2); }
    .plan-head { display: flex; justify-content: space-between; align-items: center; }
    .plan-footer { margin-top: auto; display: flex; justify-content: flex-end; }
    .price { margin: 0; font-weight: 700; }
    .invites-card { width: 100%; margin-top: 0; }
    .invites-card.tight { padding: 0.75rem 0.75rem 0.75rem; box-shadow: none; border-radius: 12px; }
    .invites-card .card-body { display: block; padding: 0.25rem 0.5rem 0.5rem; }
    .invites-card .table { margin: 0; }
    .users-card .card-body { padding-top: 0.5rem; }
    .plugin-card { padding: 0.35rem 0.35rem 0.75rem; }
    .plugin-body { padding: 0.75rem 0.75rem 0.5rem; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 24px; z-index: 9999; }
    .modal.users-modal { width: min(520px, 92vw); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; box-shadow: 0 18px 48px rgba(0,0,0,0.35); display: flex; flex-direction: column; overflow: hidden; }
    .modal.users-modal .modal-header { padding: 14px 16px 8px; }
    .modal.users-modal .modal-body { padding: 12px 16px 8px; }
    .modal.users-modal .modal-footer { padding: 12px 16px 16px; }
  `]
})
export class TenantSettingsComponent implements OnInit {
    loading = signal(false);
    saving = signal(false);
    billingLoading = signal(false);
    inviteLoading = signal(false);
    usersLoading = signal(false);
    userSaving = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);
    activeTab: 'branding' | 'invitations' | 'users' | 'billing' | 'plugins' = 'branding';

    draft: Partial<Tenant> = {
        customization: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            accentColor: '#1EA7FF',
        },
        locale: 'en',
        timezone: 'UTC',
        weekStartsOn: 'monday',
        currency: 'USD',
        academicYear: {},
    };

    invitations = signal<Invitation[]>([]);
    inviteEmail = '';
    selectedRoles = signal<Role[]>([]);
    selectedRoleIds = signal<string[]>([]);

    users = signal<User[]>([]);
    roles = this.roleService.roles;
    showUserModal = signal(false);
    editingUser = signal<User | null>(null);
    userRoles = signal<Role[]>([]);
    userRoleIds = signal<string[]>([]);
    userForm: { name: string; email: string; password: string; forcePasswordReset?: boolean; mfaEnabled?: boolean } = { name: '', email: '', password: '', forcePasswordReset: true, mfaEnabled: true };
    selectedUserIds = signal<Set<string>>(new Set());
    selectAllUsers = signal(false);
    showPermissionModal = signal(false);
    selectedPermissionIds = signal<string[]>([]);

    subscription = signal<Subscription | null>(null);
    plans = [
        { id: 'free' as SubscriptionPlan, label: 'Free', price: '$0', perks: ['Basic features', 'Community support'] },
        { id: 'basic' as SubscriptionPlan, label: 'Basic', price: '$49', perks: ['Core modules', 'Email support'] },
        { id: 'premium' as SubscriptionPlan, label: 'Premium', price: '$99', perks: ['Finance/HR/Library', 'Priority support'] },
        { id: 'enterprise' as SubscriptionPlan, label: 'Enterprise', price: '$199', perks: ['All modules', 'Dedicated CSM'] },
    ];

    constructor(
        private tenantSettingsService: TenantSettingsService,
        private invitationService: InvitationService,
        private subscriptionService: SubscriptionService,
        private userService: UserService,
        public roleService: RoleService,
    ) { }

    ngOnInit(): void {
        this.load();
        this.loadInvitations();
        this.loadSubscription();
    }

    openUsersTab(): void {
        this.activeTab = 'users';
        this.loadUsers();
        if (!this.roles().length) {
            this.roleService.getRoles().subscribe();
        }
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);
        this.tenantSettingsService.getSettings().subscribe({
            next: (tenant) => {
                this.draft = {
                    ...this.draft,
                    ...tenant,
                    customization: { ...this.draft.customization, ...(tenant.customization || {}) },
                    academicYear: tenant.academicYear || {},
                };
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load tenant settings');
                this.loading.set(false);
            }
        });
    }

    save(): void {
        this.saving.set(true);
        this.error.set(null);
        this.success.set(null);
        this.tenantSettingsService.updateSettings({
            customization: this.draft.customization,
            locale: this.draft.locale,
            timezone: this.draft.timezone,
            weekStartsOn: this.draft.weekStartsOn as any,
            currency: this.draft.currency,
            academicYear: this.draft.academicYear as any,
        }).subscribe({
            next: (tenant) => {
                this.success.set('Settings saved');
                this.draft = {
                    ...this.draft,
                    ...tenant,
                    customization: { ...this.draft.customization, ...(tenant.customization || {}) },
                    academicYear: tenant.academicYear || {},
                };
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to save settings');
                this.saving.set(false);
            }
        });
    }

    reset(): void {
        this.load();
    }

    // Invitations
    loadInvitations(): void {
        this.inviteLoading.set(true);
        this.invitationService.list().subscribe({
            next: (list) => {
                this.invitations.set(list);
                this.inviteLoading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load invitations');
                this.inviteLoading.set(false);
            }
        });
    }

    onRoleSelection(roles: Role[]): void {
        this.selectedRoles.set(roles);
        this.selectedRoleIds.set(roles.map(r => r.id));
    }

    sendInvite(): void {
        if (!this.inviteEmail) {
            this.error.set('Please enter an email to invite');
            return;
        }
        if (!this.selectedRoles().length) {
            this.error.set('Select at least one role');
            return;
        }
        this.inviteLoading.set(true);
        const roles = this.selectedRoles().map(r => r.name);
        this.invitationService.create(this.inviteEmail, roles).subscribe({
            next: (inv) => {
                this.invitations.set([inv, ...this.invitations()]);
                this.inviteEmail = '';
                this.selectedRoles.set([]);
                this.selectedRoleIds.set([]);
                this.inviteLoading.set(false);
                this.success.set('Invitation sent');
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to send invite');
                this.inviteLoading.set(false);
            }
        });
    }

    resend(inv: Invitation): void {
        this.invitationService.resend(inv.id).subscribe({
            next: (updated) => {
                this.invitations.set(this.invitations().map(i => i.id === updated.id ? updated : i));
                this.success.set('Invitation resent');
            },
            error: (err) => this.error.set(err.error?.message || 'Failed to resend invite')
        });
    }

    revoke(inv: Invitation): void {
        this.invitationService.revoke(inv.id).subscribe({
            next: (updated) => {
                this.invitations.set(this.invitations().map(i => i.id === updated.id ? updated : i));
                this.success.set('Invitation revoked');
            },
            error: (err) => this.error.set(err.error?.message || 'Failed to revoke invite')
        });
    }

    // Subscription
    loadSubscription(): void {
        this.billingLoading.set(true);
        this.subscriptionService.getCurrent().subscribe({
            next: (sub) => {
                this.subscription.set(sub);
                this.billingLoading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load subscription');
                this.billingLoading.set(false);
            }
        });
    }

    changePlan(plan: SubscriptionPlan): void {
        const billingEmail = this.subscription()?.billingEmail || 'billing@tenant.local';
        this.billingLoading.set(true);
        this.subscriptionService.changePlan(plan, billingEmail).subscribe({
            next: (sub) => {
                this.subscription.set(sub);
                this.billingLoading.set(false);
                this.success.set('Plan updated');
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to change plan');
                this.billingLoading.set(false);
            }
        });
    }

    // Users
    loadUsers(): void {
        this.usersLoading.set(true);
        this.userService.getUsers().subscribe({
            next: (list) => {
                this.users.set(list);
                this.selectedUserIds.set(new Set());
                this.selectAllUsers.set(false);
                this.usersLoading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load users');
                this.usersLoading.set(false);
            }
        });
    }

    openUserModal(user?: User): void {
        if (user) {
            this.editingUser.set(user);
            this.userForm = { name: user.name, email: user.email, password: '', forcePasswordReset: user.forcePasswordReset || false, mfaEnabled: user.mfaEnabled || false };
            const matchedRole = user.role ? this.roles().find(r => r.id === user.role!.id) : undefined;
            const roleList = matchedRole ? [matchedRole] : [];
            this.userRoles.set(roleList);
            this.userRoleIds.set(roleList.map(r => r.id));
        } else {
            this.editingUser.set(null);
            this.userForm = { name: '', email: '', password: '', forcePasswordReset: true, mfaEnabled: true };
            this.userRoles.set([]);
            this.userRoleIds.set([]);
        }
        if (!this.roles().length) {
            this.roleService.getRoles().subscribe();
        }
        this.showUserModal.set(true);
    }

    setUserRoles(roles: Role[]): void {
        this.userRoles.set(roles);
        this.userRoleIds.set(roles.map(r => r.id));
    }

    generatePassword(): void {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < 14; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.userForm.password = pwd;
    }

    closeUserModal(): void {
        this.showUserModal.set(false);
    }

    toggleUserSelection(user: User): void {
        const next = new Set(this.selectedUserIds());
        if (next.has(user.id)) {
            next.delete(user.id);
        } else {
            next.add(user.id);
        }
        this.selectedUserIds.set(next);
        this.selectAllUsers.set(next.size === this.users().length);
    }

    toggleSelectAll(event: any): void {
        const checked = event.target.checked;
        this.selectAllUsers.set(checked);
        if (checked) {
            this.selectedUserIds.set(new Set(this.users().map(u => u.id)));
        } else {
            this.selectedUserIds.set(new Set());
        }
    }

    bulkDelete(): void {
        if (!this.selectedUserIds().size) return;
        if (!confirm(`Delete ${this.selectedUserIds().size} user(s)?`)) return;
        const ids = Array.from(this.selectedUserIds());
        ids.forEach((id) => {
            this.userService.deleteUser(id).subscribe({
                next: () => {
                    this.users.set(this.users().filter(u => u.id !== id));
                    const next = new Set(this.selectedUserIds());
                    next.delete(id);
                    this.selectedUserIds.set(next);
                    this.selectAllUsers.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to delete user');
                }
            });
        });
    }

    openPermissionModal(): void {
        if (!this.roleService.permissionTree().length) {
            this.roleService.getPermissionTree().subscribe();
        }
        this.showPermissionModal.set(true);
    }

    closePermissionModal(): void {
        this.showPermissionModal.set(false);
        this.selectedPermissionIds.set([]);
    }

    assignPermissions(): void {
        const permissionIds = this.selectedPermissionIds();
        const ids = Array.from(this.selectedUserIds());
        ids.forEach((id) => {
            this.userService.addPermissionsToUser(id, permissionIds).subscribe({
                next: () => { },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to assign permissions');
                }
            });
        });
        this.success.set('Permissions assigned');
        this.closePermissionModal();
    }

    saveUser(): void {
        this.userSaving.set(true);
        const selectedRoleId = this.userRoles().length ? this.userRoles()[0].id : undefined;
        const payload = {
            name: this.userForm.name,
            email: this.userForm.email,
            roleId: selectedRoleId,
            forcePasswordReset: this.userForm.forcePasswordReset,
            mfaEnabled: this.userForm.mfaEnabled,
        };
        if (this.editingUser()) {
            this.userService.updateUser(this.editingUser()!.id, payload).subscribe({
                next: (user) => {
                    this.users.set(this.users().map(u => u.id === user.id ? user : u));
                    this.userSaving.set(false);
                    this.success.set('User updated');
                    this.closeUserModal();
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to update user');
                    this.userSaving.set(false);
                }
            });
        } else {
            this.userService.createUser({ ...payload, password: this.userForm.password }).subscribe({
                next: (user) => {
                    this.users.set([user, ...this.users()]);
                    this.userSaving.set(false);
                    this.success.set('User created');
                    this.closeUserModal();
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to create user');
                    this.userSaving.set(false);
                }
            });
        }
    }
}
