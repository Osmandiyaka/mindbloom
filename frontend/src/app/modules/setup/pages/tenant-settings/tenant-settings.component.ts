import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { InvitationService, Invitation, InvitationStatus } from '../../../../core/services/invitation.service';
import { SubscriptionService, Subscription, SubscriptionPlan } from '../../../../core/services/subscription.service';
import { PluginLauncherComponent } from '../../../plugins/pages/plugin-launcher/plugin-launcher.component';
import { RouterModule } from '@angular/router';
import { Tenant } from '../../../../core/services/tenant.service';
import { RoleSelectorComponent } from '../../../../shared/components/role-selector/role-selector.component';
import { Role } from '../../../../core/models/role.model';
import { UserService, User } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionTreeSelectorComponent } from '../../../../shared/components/permission-tree-selector/permission-tree-selector.component';
import { SchoolSettingsComponent } from '../school-settings/school-settings.component';
import { RoleListComponent } from '../roles/role-list.component';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PluginLauncherComponent, RouterModule, RoleSelectorComponent, PermissionTreeSelectorComponent, RoleListComponent, SchoolSettingsComponent],
  template: `
    <div class="tenant-settings compact">

      <div class="tabs">
        <button [class.active]="activeTab === 'school'" (click)="activeTab = 'school'">School Settings</button>
        <button [class.active]="activeTab === 'invitations'" (click)="activeTab = 'invitations'">Invitations & Users</button>
        <button [class.active]="activeTab === 'roles'" (click)="activeTab = 'roles'">Roles & Permissions</button>
        <button [class.active]="activeTab === 'billing'" (click)="activeTab = 'billing'">Billing & Subscription</button>
        <button [class.active]="activeTab === 'plugins'" (click)="activeTab = 'plugins'">Plugins</button>
        <button [class.active]="activeTab === 'templates'" (click)="activeTab = 'templates'">ID Templates</button>
      </div>

      <ng-container [ngSwitch]="activeTab">
        <div *ngSwitchCase="'school'" class="panel school-panel">
          <app-school-settings />
        </div>

        <div *ngSwitchCase="'invitations'" class="panel invitations-panel">
          <div class="panel-header stacked slim">
            <div>
              <p class="subtitle">Invite staff or partners with roles, manage existing users, and keep access up to date.</p>
            </div>
          </div>
          <div class="card invites-card tight users-card">
            <div class="card-body toolbar">
              <div class="selection-toolbar" [class.active]="selectedUserIds().size">
                <span class="selected-count" *ngIf="selectedUserIds().size">{{ selectedUserIds().size }} selected</span>
                <div class="actions left-actions">
                  <button class="btn ghost small danger" [disabled]="!selectedUserIds().size" (click)="bulkDelete()">
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
              <div class="actions right">
                <button class="btn primary" (click)="openUserModal()">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm7-3h-2v-2h-2V7h2V5h2v2h2v2h-2v2Z" fill="currentColor"/></svg>
                  Add User
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
                    <td>
                      <div class="user-identity">
                        <span class="avatar solid" [style.background]="getAvatarColor(user.email || user.name)">{{ getInitial(user.name || user.email) }}</span>
                        <div>
                          <div>{{ user.name }}</div>
                          <div class="muted tiny">ID {{ user.id.slice(-6) }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="mono">{{ user.email }}</td>
                    <td>{{ user.role?.name || '—' }}</td>
                    <td>{{ user.createdAt | date:'mediumDate' }}</td>
                    <td class="actions">
                      <button class="mini-btn ghost" (click)="openUserModal(user)" title="Edit User">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04a.996.996 0 0 0 0-1.41l-2.5-2.5a.996.996 0 1 0-1.41 1.41l2.5 2.5a.996.996 0 0 0 1.41 0Z" fill="currentColor"/></svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!users().length" class="muted">No users yet.</p>
            </div>
          </div>
          <div class="card invites-card tight">
            <div class="invite-row capsule">
              <span class="capsule-icon">
                <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.51l8 5.33 8-5.33V6H4Zm0 3.36V18h16V9.36l-7.47 4.98a2 2 0 0 1-2.06 0L4 9.36Z" fill="currentColor"/></svg>
              </span>
              <input
                class="invite-input"
                type="email"
                name="inviteEmail"
                required
                [(ngModel)]="inviteEmail"
                 />
              <span class="capsule-divider"></span>
              <app-role-selector
                class="invite-roles inline"
                [selectedRoleIds]="selectedRoleIds()"
                (selectionChange)="onRoleSelection($event)" />
              <button class="btn primary shadow-md invite-submit" (click)="sendInvite()" [disabled]="inviteLoading() || !isValidEmail(inviteEmail)">
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
                      <span class="avatar" [style.background]="getAvatarColor(inv.email)">{{ getInitial(inv.email) }}</span>
                      <div class="email-block">
                        <span class="email mono strong">{{ inv.email }}</span>
                        <span class="muted tiny">Token • {{ inv.token ? inv.token.slice(-6) : '••••••' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="role-stack" *ngIf="inv.roles.length; else noRoles">
                        <span *ngFor="let role of inv.roles" class="role-chip" [ngClass]="roleChipClass(role)">{{ role }}</span>
                      </div>
                      <ng-template #noRoles><span class="pill neutral">—</span></ng-template>
                    </td>
                    <td>
                      <span [class]="statusClass(inv.status)">{{ statusLabel(inv.status) }}</span>
                    </td>
                    <td>
                      <div class="expiry">
                        <span class="expiry-date mono">{{ inv.expiresAt | date:'mediumDate' }}</span>
                        <div class="expiry-track">
                          <span class="expiry-fill" [style.width.%]="expiryPercent(inv)"></span>
                        </div>
                      </div>
                    </td>
                    <td class="actions">
                      <button class="mini-btn ghost" (click)="resend(inv); $event.stopPropagation()" title="Resend Invite">
                        <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14.9-3H21l-3 3-3-3h2.1A6 6 0 1 0 6 12h2l-3 3-3-3h2z" fill="currentColor"/></svg>
                        Resend
                      </button>
                      <button class="mini-btn danger ghost" (click)="revoke(inv); $event.stopPropagation()" title="Revoke Invite">
                        <svg viewBox="0 0 24 24"><path d="M6 6h12v2H6V6Zm2 4h8v2H8v-2Zm-2 4h12v2H6v-2Z" fill="currentColor"/></svg>
                        Revoke
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="!invitations().length" class="empty-state">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.51l8 5.33 8-5.33V6H4Zm0 3.36V18h16V9.36l-7.47 4.98a2 2 0 0 1-2.06 0L4 9.36Z" fill="currentColor"/>
                </svg>
                <p class="muted">No invitations have been sent yet. <strong>Send your first one above!</strong></p>
              </div>
            </div>
          </div>

          <div class="overlay" *ngIf="showUserModal()">
            <div class="modal users-modal">
              <header class="modal-header">
                <div class="title-row">
                  <svg class="title-icon" viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3 0-6 1.34-6 4v2h12v-2c0-2.66-3-4-6-4Z" fill="currentColor"/>
                  </svg>
                  <h2>{{ editingUser() ? 'Edit User' : 'Add User' }}</h2>
                </div>
                <a class="close-btn link" (click)="closeUserModal()" aria-label="Close">Close</a>
              </header>
              <div class="modal-body user-form">
                <div class="field">
                  <label>Name</label>
                  <input type="text" [(ngModel)]="userForm.name" placeholder="Jane Doe" />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="userEmail"
                    required
                    [(ngModel)]="userForm.email"
                    placeholder="user@school.com" />
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
                    class="user-role-selector"
                    [selectedRoleIds]="userRoleIds()"
                    (selectionChange)="setUserRoles($event)" />
                  <div class="selected-roles" *ngIf="userRoles().length">
                    <span *ngFor="let r of userRoles()" class="chip">
                      <svg viewBox="0 0 24 24"><path d="M9.5 17 5 12.5l1.5-1.5L9.5 14l8-8 1.5 1.5-9.5 9.5Z" fill="currentColor"/></svg>
                      {{ r.name }}
                    </span>
                  </div>
              </div>
              <div class="section-divider"></div>
              <div class="field inline-toggles">
                <label>Security</label>
                <label class="toggle switch">
                    <input type="checkbox" [(ngModel)]="userForm.forcePasswordReset" />
                    <span class="track"><span class="thumb"></span></span>
                    <span>Force password reset on first login</span>
                  </label>
                  <label class="toggle switch">
                    <input type="checkbox" [(ngModel)]="userForm.mfaEnabled" />
                    <span class="track"><span class="thumb"></span></span>
                    <span>Require MFA</span>
                  </label>
                </div>
              </div>
              <footer class="modal-footer">
                <button class="btn primary" (click)="saveUser()" [disabled]="userSaving() || !isValidEmail(userForm.email)">
                  <svg viewBox="0 0 24 24"><path d="m9 16-3.5-3.5L7 12l2 2 8-8 1.5 1.5L9 16Z" fill="currentColor"/></svg>
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
                <button class="primary emphasized" (click)="assignPermissions()" [disabled]="!selectedPermissionIds().length">
                  Assign to {{ selectedUserIds().size }} user(s)
                </button>
              </footer>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'roles'" class="panel roles-panel">
          <app-role-list />
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

        <div *ngSwitchCase="'templates'" class="panel templates-panel">
            <div class="panel-header padded">
              <div class="stacked">
                <h2 class="themed-heading">ID Templates</h2>
                <p class="subtitle">Configure how admission numbers and roll numbers are generated.</p>
              </div>
              <div class="actions">
              <button class="btn primary" type="button" (click)="saveTemplates()" [disabled]="templatesSaving()">
                <svg viewBox="0 0 24 24"><path d="m3.4 21 18.3-9L3.4 3v6.5l13.1 2-13.1 2V21Z" fill="currentColor"/></svg>
                {{ templatesSaving() ? 'Saving...' : 'Save Templates' }}
              </button>
              </div>
            </div>

          <div class="template-card">
            <div class="template-grid">
              <div class="template-section">
                <div class="section-head">
                  <span class="chip subtle">Admission</span>
                  <span class="muted">e.g. ADM-2025-0042</span>
                </div>
                <div class="field-row">
                  <label>Prefix</label>
                  <input type="text" [(ngModel)]="templates.admissionPrefix" maxlength="10" />
                </div>
                <div class="field-row two-cols">
                  <div>
                    <label>Sequence length</label>
                    <input type="number" min="2" max="6" [(ngModel)]="templates.admissionSeqLength" />
                  </div>
                  <div class="checkbox-row">
                    <label>
                      <input type="checkbox" [(ngModel)]="templates.includeYear" />
                      Include academic year
                    </label>
                    <label>
                      <input type="checkbox" [(ngModel)]="templates.resetPerYear" />
                      Reset each year
                    </label>
                  </div>
                </div>
                <div class="preview">
                  <span class="muted">Preview</span>
                  <strong>{{ admissionPreview }}</strong>
                </div>
              </div>

              <div class="template-section">
                <div class="section-head">
                  <span class="chip subtle">Roll</span>
                  <span class="muted">e.g. 7B-15</span>
                </div>
                <div class="field-row two-cols">
                  <div>
                    <label>Prefix (optional)</label>
                    <input type="text" [(ngModel)]="templates.rollPrefix" maxlength="10" />
                  </div>
                  <div>
                    <label>Sequence length</label>
                    <input type="number" min="1" max="4" [(ngModel)]="templates.rollSeqLength" />
                  </div>
                </div>
                <div class="field-row two-cols">
                  <div>
                    <label>Sample class</label>
                    <input type="text" [(ngModel)]="templates.sampleClass" />
                  </div>
                  <div>
                    <label>Sample section</label>
                    <input type="text" [(ngModel)]="templates.sampleSection" />
                  </div>
                </div>
                <div class="checkbox-row">
                  <label>
                    <input type="checkbox" [(ngModel)]="templates.resetPerClass" />
                    Reset per class/section
                  </label>
                </div>
                <div class="preview">
                  <span class="muted">Preview</span>
                  <strong>{{ rollPreview }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="alert" *ngIf="error()"><span>{{ error() }}</span></div>
      <div class="alert success" *ngIf="success()"><span>{{ success() }}</span></div>
    </div>
  `,
  styles: [`
    .tenant-settings { max-width: 1220px; margin: 0 auto; padding: 1.25rem 1.5rem 1.5rem; background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); color: var(--color-text-primary); border: none; border-radius: 18px; box-shadow: 0 18px 48px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.18); }
    .tenant-settings.compact { padding-top: 0.75rem; }
    .page-header { margin-bottom: 0; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-size: 12px; margin: 0 0 4px 0; }
    h1 { margin: 0; }
    h2 { margin: 0; font-size: 1.4rem; letter-spacing: -0.01em; }
    .subtitle { margin: 4px 0 0 0; color: var(--color-text-secondary); }
    .tabs { display: flex; gap: 1.25rem; margin: 0.75rem 0 1.35rem 0; flex-wrap: wrap; padding-bottom: 0.35rem; border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent); }
    .tabs button { padding: 0.35rem 0; border-radius: 0; border: none; background: transparent; cursor: pointer; transition: color 0.2s ease, transform 0.2s ease; color: var(--color-text-secondary); font-weight: 700; position: relative; }
    .tabs button::after { content: ''; position: absolute; left: 0; right: 0; bottom: -0.45rem; height: 2px; border-radius: 999px; background: transparent; transition: background 0.2s ease, transform 0.2s ease; transform: scaleX(0.7); }
    .tabs button:hover { color: var(--color-text-primary); transform: translateY(-1px); }
    .tabs button.active { color: var(--color-primary); }
    .tabs button.active::after { background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark)); transform: scaleX(1); }
    .actions { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .actions.sticky-actions { justify-content: flex-end; margin-top: 0.75rem; padding-right: 0.25rem; }
    .actions.sticky-actions .action-buttons { display: flex; gap: 0.75rem; }
    .actions.sticky-actions .spacer { flex: 1; }
    .btn { padding: 0.65rem 1.25rem; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent); cursor: pointer; background: color-mix(in srgb, var(--color-surface) 85%, var(--color-surface-hover) 15%); color: var(--color-text-primary); transition: all 0.2s ease; box-shadow: 0 10px 24px rgba(0,0,0,0.12); display: inline-flex; align-items: center; gap: 0.4rem; }
    .btn svg { width: 18px; height: 18px; }
    .btn.ghost { background: transparent; border-color: color-mix(in srgb, var(--color-border) 40%, transparent); box-shadow: none; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; border: none; box-shadow: 0 12px 28px rgba(var(--color-primary-rgb, 123, 140, 255), 0.3); }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(0,0,0,0.16); }
    .btn:active { transform: translateY(0); }
    .btn.emphasized { padding: 0.7rem 1.4rem; box-shadow: 0 14px 30px rgba(var(--color-primary-rgb,123,140,255),0.28); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
    .card { background: color-mix(in srgb, var(--color-surface) 88%, var(--color-surface-hover) 12%); border: none; border-radius: 18px; box-shadow: 0 16px 38px rgba(0,0,0,0.16); display: flex; flex-direction: column; }
    .card.padded { padding: 0.35rem 0.35rem 0.75rem; }
    .card-header { padding: 1.25rem 1.25rem 0.35rem 1.25rem; }
    .card-body { padding: 0 1.25rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--color-text-secondary); }
    input, select { padding: 0.65rem 0.75rem; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent); background: color-mix(in srgb, var(--color-background) 92%, var(--color-surface-hover) 8%); color: var(--color-text-primary); transition: all 0.2s ease; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
    input:focus, select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,123,140,255),0.18); background: var(--color-surface); }
    .color-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap: 0.75rem; }
    .logo-preview { display: flex; flex-direction: column; gap: 0.5rem; }
    .logo-preview img { max-height: 80px; max-width: 200px; object-fit: contain; border: 1px dashed var(--color-border); padding: 6px; border-radius: 8px; }
    .alert { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(var(--color-error-rgb,239,68,68),0.08); color: var(--color-error); }
    .alert.success { background: rgba(var(--color-success-rgb,16,185,129),0.08); color: var(--color-success); }
    .panel { display: flex; flex-direction: column; gap: 0.9rem; }
    .school-panel { background: transparent; border: none; border-radius: 16px; padding: 0; box-shadow: none; }
    .invitations-panel { max-width: 1100px; gap: 0.5rem; background: var(--color-surface); border-radius: 16px; padding: 0.5rem 0.65rem 0.8rem; }
    .panel.users-panel { background: transparent; border: none; border-radius: 16px; padding: 0; box-shadow: none; }
    .billing-panel { background: transparent; border: none; border-radius: 16px; padding: 0; box-shadow: none; }
    .plugins-panel { max-width: 1100px; gap: 0.5rem; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0 0.35rem; }
    .panel-header.stacked { flex-direction: column; align-items: stretch; }
    .panel-header.slim { margin-bottom: 0.25rem; padding: 0 0.35rem; }
    .panel-header.spaced { padding: 0 0.35rem; }
    .panel-header.padded { padding: 0 0.35rem; }
    .panel-header.users-header { background: transparent; border: none; border-radius: 12px; padding: 0.9rem 0.25rem; box-shadow: none; }
    .invite-card { background: color-mix(in srgb, var(--color-surface) 65%, transparent); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.22); display: flex; flex-direction: column; gap: 0.75rem; backdrop-filter: blur(10px); border-top: 1px solid rgba(255,255,255,0.1); }
    .invite-card.flat { box-shadow: none; border-radius: 12px; border-color: transparent; }
    .invite-row { display: flex; align-items: center; gap: 0.4rem; background: rgba(0,0,0,0.24); padding: 0.5rem; border-radius: 14px; border: none; box-shadow: none; }
    .invite-row.compact { margin-bottom: 0.25rem; }
    .invite-row.capsule {
      gap: 0.4rem;
      background: rgba(0,0,0,0.18);
      border-radius: 999px;
      padding: 0.35rem 0.5rem;
      border: 1px solid rgba(255,255,255,0.08);
      align-items: center;
      box-shadow: none;
    }
    .capsule-icon { display: inline-flex; align-items: center; justify-content: center; padding: 0 0.35rem; color: var(--color-accent, #70c6e1); }
    .capsule-icon svg { width: 18px; height: 18px; display: block; }
    .capsule-divider { width: 1px; height: 26px; background: rgba(255,255,255,0.1); margin: 0 0.35rem; }
    .invite-input {
      flex: 1;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-surface) 80%, transparent);
      min-height: 42px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.25);
      padding: 0.4rem 0.9rem 0.4rem 2.8rem;
      color: var(--color-text-primary);
      font-weight: 600;
      font-size: 1rem;
      outline: none;
      width: 100%;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2370C6E1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'/%3E%3Cpath d='m22 6-10 7L2 6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-size: 18px 18px;
      background-position: 14px center;
    }
    .invite-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb,232,190,20),0.3), 0 0 10px rgba(var(--color-primary-rgb,232,190,20),0.2);
    }
    .invite-roles { min-width: 190px; height: 42px; display: flex; align-items: center; border: none; border-radius: 12px; padding: 0; background: transparent; color: var(--color-text-secondary); position: relative; }
    .invite-submit { height: 42px; display: inline-flex; align-items: center; justify-content: center; padding: 0.55rem 1rem; color: var(--color-surface, #0f0f12); background: linear-gradient(135deg, #E8BE14 0%, #BF9532 100%); box-shadow: 0 4px 12px rgba(232,190,20,0.4); border: none; font-weight: 700; letter-spacing: 0.5px; border-radius: 999px; margin-left: 0.5rem; }
    .invite-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(232,190,20,0.6); }
    .selected-roles { display: flex; gap: 6px; flex-wrap: wrap; background: rgba(0,0,0,0.1); padding: 0.3rem 0.5rem; border-radius: 10px; }
    .selected-roles .chip { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.12); color: var(--color-primary); padding: 5px 9px; border-radius: 999px; border: none; font-weight: 700; box-shadow: 0 10px 20px rgba(16,185,129,0.18); }
    .selected-roles .chip svg { width: 14px; height: 14px; }
    .role-stack { display: flex; flex-wrap: wrap; gap: 6px; }
    .role-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
    .role-chip.admin { background: rgba(82,109,255,0.16); border-color: rgba(82,109,255,0.3); color: #a5b4ff; }
    .role-chip.principal { background: rgba(232,190,20,0.16); border-color: rgba(232,190,20,0.4); color: #facc15; }
    .role-chip.teacher { background: rgba(16,185,129,0.16); border-color: rgba(16,185,129,0.4); color: #34d399; }
    .role-chip.manager { background: rgba(14,165,233,0.16); border-color: rgba(14,165,233,0.4); color: #38bdf8; }
    .role-chip.neutral { color: var(--color-text-secondary); }
    .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px; font-weight: 700; text-transform: capitalize; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
    .status-pill.pending { color: #f59e0b; border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.12); text-shadow: 0 0 5px currentColor; }
    .status-pill.accepted { color: #22c55e; border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.12); text-shadow: 0 0 5px currentColor; }
    .status-pill.sent { color: #0ea5e9; border-color: rgba(14,165,233,0.35); background: rgba(14,165,233,0.12); }
    .status-pill.revoked { color: rgba(231,76,60,0.8); border-color: rgba(231,76,60,0.25); background: rgba(231,76,60,0.1); text-decoration: line-through; }
    .status-pill.expired { color: #a855f7; border-color: rgba(168,85,247,0.35); background: rgba(168,85,247,0.12); }
    .expiry { display: flex; flex-direction: column; gap: 4px; }
    .expiry-track { width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
    .expiry-fill { display: block; height: 100%; background: linear-gradient(90deg, #22c55e, #e8be14); transition: width 0.4s ease; }
    .pill { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 999px; font-weight: 600; background: color-mix(in srgb, var(--color-surface-hover) 80%, transparent); color: var(--color-text-secondary); }
    .pill.neutral { background: color-mix(in srgb, var(--color-surface) 75%, transparent); color: var(--color-text-primary); }
    .table { width: 100%; border-collapse: separate; border-spacing: 0 6px; background: transparent; color: var(--color-text-primary); }
    .table th, .table td { padding: 0.55rem 0.75rem; text-align: left; color: var(--color-text-primary); background: transparent; }
    .table th { color: var(--color-text-secondary); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; background: transparent; border-bottom: 1px solid rgba(232,190,20,0.3); padding-bottom: 10px; }
    .table tr td:first-child, .table tr th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    .table tr td:last-child, .table tr th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
    .table tbody tr { transition: background 0.2s ease, box-shadow 0.2s ease; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .table tbody tr:hover { background: linear-gradient(90deg, transparent, rgba(232,190,20,0.06), transparent); box-shadow: 0 8px 18px rgba(0,0,0,0.18); }
    .table.invites th, .table.invites td { padding: 0.45rem 0.65rem; line-height: 1.2; vertical-align: middle; }
    .table.invites th:last-child, .table.invites td:last-child { text-align: right; }
    .table.invites td.email-cell { display: flex; align-items: center; gap: 0.4rem; }
    .table.invites td.email-cell svg { width: 18px; height: 18px; flex-shrink: 0; }
    .expiry-date { font-size: 0.85rem; }
    .avatar { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #0f0f12; font-weight: 800; box-shadow: 0 10px 20px rgba(0,0,0,0.25); }
    .avatar.solid { color: #0b1221; }
    .email-block { display: flex; flex-direction: column; gap: 2px; }
    .email-block .email { font-weight: 600; color: #fff; }
    .mono { font-family: SFMono-Regular, Consolas, 'Liberation Mono', monospace; }
    .tiny { font-size: 12px; }
    .table input[type="checkbox"] { accent-color: var(--color-primary); }
    .mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.35rem 0.6rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: var(--color-text-primary); cursor: pointer; transition: transform 0.12s ease, box-shadow 0.2s ease; font-weight: 700; }
    .mini-btn svg { width: 16px; height: 16px; }
    .mini-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,0.18); }
    .mini-btn.ghost { background: transparent; }
    .mini-btn.danger { color: var(--color-error); border-color: rgba(239,68,68,0.3); }
    .user-identity { display: inline-flex; align-items: center; gap: 8px; }
    .actions-spacer { flex: 1; }
    .user-form { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.75rem 0.9rem 1rem; background: #3E2D20; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 2px 4px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.16); }
    .user-form .field { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.25rem 0.35rem; background: rgba(255,255,255,0.02); border-radius: 10px; }
    .user-form label { font-weight: 800; color: var(--color-text-primary); font-size: 0.92rem; letter-spacing: 0.01em; }
    .user-form input, .user-form select { width: 100%; padding: 0.65rem 0.75rem; border-radius: 10px; border: none; background: #3E2D20; color: var(--color-text-primary); transition: all 0.18s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); }
    .user-form input:focus, .user-form select:focus { outline: none; border: 1px solid rgba(232,190,20,0.6); box-shadow: inset 0 2px 4px rgba(0,0,0,0.35), 0 0 0 2px rgba(232,190,20,0.25); background: #463426; }
    .password-row { display: flex; gap: 0.5rem; align-items: center; }
    .password-row input { flex: 1; }
    .password-row .btn { padding: 0.55rem 0.9rem; }
    .password-row .btn.ghost { border: 1px solid rgba(112,198,225,0.6); color: #70C6E1; }
    .password-row .btn.ghost:active { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
    .hint { margin: 0; color: #AB9F95; font-size: 0.82rem; }
    .inline-toggles { gap: 0.35rem !important; }
    .inline-toggles .toggle { display: inline-flex; align-items: center; gap: 0.55rem; font-weight: 700; color: var(--color-text-primary); padding: 0.35rem 0.5rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
    .inline-toggles .toggle input { appearance: none; width: 0; height: 0; opacity: 0; position: absolute; }
    .inline-toggles .toggle .track { width: 38px; height: 20px; border-radius: 999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); display: inline-flex; align-items: center; padding: 2px; transition: all 0.2s ease; }
    .inline-toggles .toggle .thumb { width: 16px; height: 16px; border-radius: 999px; background: rgba(255,255,255,0.7); transition: transform 0.2s ease, background 0.2s ease; }
    .inline-toggles .toggle input:checked + .track { background: rgba(232,190,20,0.25); border-color: rgba(232,190,20,0.6); }
    .inline-toggles .toggle input:checked + .track .thumb { transform: translateX(16px); background: #E8BE14; }
    .user-form .selected-roles { margin-top: 0.25rem; }
    .user-form .chip { background: rgba(232,190,20,0.14); color: #E8BE14; border: 1px solid rgba(232,190,20,0.35); box-shadow: none; }
    .user-form .chip.system { background: rgba(112,198,225,0.14); color: #70C6E1; border-color: rgba(112,198,225,0.35); }
    :host ::ng-deep app-role-selector.user-role-selector .role-trigger {
      background: #3E2D20;
      border: 1px solid rgba(232,190,20,0.3);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
      color: var(--color-text-primary);
    }
    .section-divider { height: 1px; width: 100%; background: linear-gradient(90deg, rgba(232,190,20,0.45), rgba(232,190,20,0)); border: none; margin: 0.25rem 0 0.35rem; }
    .muted { color: var(--color-text-tertiary); }
    .success { color: var(--color-success, #22c55e); }
    .badge { padding: 0; border-radius: 0; background: transparent; box-shadow: none; font-weight: 500; text-transform: capitalize; display: inline-flex; align-items: center; gap: 6px; }
    .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px currentColor; background: currentColor; }
    .badge.revoked { color: var(--color-error); }
    .badge.pending { color: var(--color-warning, #f39c12); }
    .badge.accepted { color: var(--color-success, #70ad47); }
    .actions .btn { padding: 0.4rem 0.7rem; box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
    .actions .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; background: color-mix(in srgb, var(--color-surface) 88%, var(--color-surface-hover) 12%); }
    .btn.small { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
    .btn.danger { color: var(--color-error); }
    .shadow-md { box-shadow: var(--shadow-md, 10px 10px 20px rgba(0,0,0,0.7), -6px -6px 12px rgba(255,255,255,0.07)); }
    .table td.actions { background: transparent; text-align: right; }
    .action-link { background: transparent; border: none; color: var(--color-info, #5eb5d7); padding: 0; font-weight: 650; cursor: pointer; text-decoration: none; }
    .action-link.danger { color: var(--color-error, #e74c3c); }
    .action-link:hover { text-decoration: underline; }
    .empty-state { text-align: center; margin: 0.6rem 0 0; color: var(--color-text-tertiary); display: grid; place-items: center; gap: 0.4rem; }
    .empty-state svg { width: 36px; height: 36px; color: #E8BE14; }
    /* Flatten role-selector button inside invite bar */
    :host ::ng-deep app-role-selector.invite-roles .role-trigger {
      position: relative;
      width: 100%;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: none !important;
      outline: none;
      padding: 8px 12px;
      min-width: 0;
      color: var(--color-text-primary);
      gap: 10px;
    }
    :host ::ng-deep app-role-selector.invite-roles .role-trigger::after {
      content: '▾';
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-tertiary);
      font-size: 0.85rem;
      pointer-events: none;
    }
    :host ::ng-deep app-role-selector.invite-roles .role-trigger:hover,
    :host ::ng-deep app-role-selector.invite-roles .role-trigger:focus-visible {
      border-color: #E8BE14;
      transform: translateY(0);
      box-shadow: 0 0 0 1px rgba(232,190,20,0.18);
    }
    :host ::ng-deep app-role-selector.invite-roles .icon-chip {
      background: rgba(255,255,255,0.06);
      color: var(--color-accent, #70c6e1);
      box-shadow: none;
    }
    :host ::ng-deep app-role-selector.invite-roles .pill {
      background: rgba(232,190,20,0.16);
      color: var(--color-primary);
      box-shadow: none;
    }
    :host ::ng-deep app-role-selector.invite-roles .trigger-text span { font-size: 0.95rem; }
    :host ::ng-deep app-role-selector.invite-roles .trigger-text small { color: var(--color-text-tertiary); }
    .plans { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1rem; }
    .plans.padded { padding: 0.5rem; }
    .plan-card { border: none; border-radius: 16px; padding: 1.1rem; background: color-mix(in srgb, var(--color-surface) 88%, var(--color-surface-hover) 12%); box-shadow: 0 14px 32px rgba(0,0,0,0.14); display: flex; flex-direction: column; gap: 0.75rem; color: var(--color-text-primary); }
    .plan-card.active { box-shadow: 0 14px 34px rgba(var(--color-primary-rgb,102,126,234),0.32); outline: 2px solid rgba(var(--color-primary-rgb,102,126,234),0.35); }
    .plan-head { display: flex; justify-content: space-between; align-items: center; }
    .plan-footer { margin-top: auto; display: flex; justify-content: flex-end; }
    .price { margin: 0; font-weight: 700; }
    .invites-card {
      width: 100%;
      margin-top: 0;
      background: linear-gradient(145deg, rgba(99, 77, 59, 0.3), rgba(79, 58, 41, 0.3));
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      border-radius: 18px;
      overflow: visible;
      position: relative;
      z-index: 20;
    }
    .invites-card.tight { padding: 0.85rem 0.85rem 0.85rem; }
    .invites-card .card-body { display: block; padding: 0.25rem 0.5rem 0.5rem; }
    .invites-card .table { margin: 0; }
    .invite-row.capsule { position: relative; z-index: 30; }
    .users-card { position: relative; z-index: 5; }
    .users-card .card-body { padding-top: 0.5rem; }
    .users-card .card-body.toolbar { background: color-mix(in srgb, var(--color-surface-hover) 60%, transparent); border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent); border-radius: 12px; }
    .selection-toolbar { display: flex; align-items: center; gap: 0.65rem; flex: 1; opacity: 0; max-height: 0; overflow: hidden; pointer-events: none; transform: translateY(6px); transition: all 0.25s ease; }
    .selection-toolbar.active .selected-count { animation: pulse-highlight 0.4s ease; background: rgba(232,190,20,0.15); padding: 0.2rem 0.4rem; border-radius: 8px; }
    .selection-toolbar.active { opacity: 1; max-height: 80px; pointer-events: auto; transform: translateY(0); }
    @keyframes pulse-highlight {
      0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(232,190,20,0.35); }
      60% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(232,190,20,0); }
      100% { transform: scale(1); box-shadow: none; }
    }
    .plugin-card { padding: 0.35rem 0.35rem 0.75rem; }
    .plugin-body { padding: 0.75rem 0.75rem 0.5rem; }
    /* ID Templates */
    .templates-panel { gap: 0.85rem; background: transparent; border: none; border-radius: 14px; padding: 0.2rem; box-shadow: none; }
    .templates-panel .panel-header { background: transparent; border: none; border-radius: 12px; padding: 0.75rem 0.35rem; box-shadow: none; }
    .template-card { background: color-mix(in srgb, var(--color-surface) 88%, var(--color-surface-hover) 12%); border: none; border-radius: 16px; padding: 1.1rem; box-shadow: 0 14px 32px rgba(0,0,0,0.14); }
    .template-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.1rem; }
    .template-section { border: none; border-radius: 14px; padding: 1rem; background: color-mix(in srgb, var(--color-surface) 92%, var(--color-surface-hover) 8%); display: flex; flex-direction: column; gap: 0.85rem; box-shadow: 0 10px 24px rgba(0,0,0,0.1); }
    .template-section .section-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .template-section .field-row { display: flex; flex-direction: column; gap: 0.4rem; }
    .template-section .field-row.two-cols { flex-direction: row; gap: 0.85rem; }
    .template-section .field-row.two-cols > div { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
    .template-section label { color: var(--color-text-secondary); font-weight: 700; font-size: 0.92rem; letter-spacing: 0.01em; }
    .template-section input[type="text"], .template-section input[type="number"] { width: 100%; background: color-mix(in srgb, var(--color-background) 92%, var(--color-surface-hover) 8%); border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent); color: var(--color-text-primary); border-radius: 12px; padding: 0.65rem 0.75rem; }
    .template-section input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb,123,140,255),0.18); outline: none; }
    .template-section .checkbox-row { display: flex; flex-direction: column; gap: 0.45rem; }
    .template-section .checkbox-row label { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-secondary); }
    .template-section .preview { border-top: 1px dashed color-mix(in srgb, var(--color-border) 60%, transparent); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
    .template-section .preview strong { color: var(--color-primary); letter-spacing: 0.02em; }
    .template-section .chip.subtle { background: rgba(var(--color-primary-rgb,123,140,255),0.12); color: var(--color-primary); padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(var(--color-primary-rgb,123,140,255),0.25); font-weight: 700; }
    .themed-heading { color: var(--color-text-primary); letter-spacing: -0.01em; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 24px; z-index: 9999; }
    /* Ensure role selector modal sits above everything else on the page */
    :host ::ng-deep app-role-selector .role-selector-overlay {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: all !important;
      transform: none !important;
    }
    :host ::ng-deep app-role-selector .modal {
      position: relative !important;
      z-index: 2147483648 !important;
    }
    .modal.users-modal { width: min(520px, 92vw); background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); border: none; border-radius: 16px; box-shadow: 0 20px 52px rgba(0,0,0,0.32); display: flex; flex-direction: column; overflow: hidden; }
    .modal.users-modal .modal-header { padding: 14px 16px 8px; position: relative; }
    .modal.users-modal .modal-header .title-row { display: flex; align-items: center; gap: 10px; }
    .modal.users-modal .modal-header .title-icon { width: 22px; height: 22px; color: #E8BE14; }
    .modal.users-modal .modal-header h2 { color: #fff; font-size: 1.45rem; margin: 0; }
    .modal.users-modal .close-btn { position: absolute; top: 12px; right: 12px; color: #E8BE14; cursor: pointer; text-decoration: none; font-weight: 700; }
    .modal.users-modal .modal-body { padding: 14px 16px 12px; background: #634D3B; }
    .modal.users-modal .modal-footer { padding: 12px 16px 16px; }
    .modal.users-modal .modal-footer .ghost { border: 1px solid rgba(232,190,20,0.35); color: #E8BE14; }
    .modal.users-modal .modal-footer .ghost:hover { background: rgba(232,190,20,0.08); }
  `]
})
export class TenantSettingsComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  templatesSaving = signal(false);
  billingLoading = signal(false);
  inviteLoading = signal(false);
  usersLoading = signal(false);
  userSaving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  activeTab: 'school' | 'invitations' | 'roles' | 'billing' | 'plugins' | 'templates' = 'school';

  templates = {
    admissionPrefix: 'ADM',
    admissionSeqLength: 4,
    includeYear: true,
    resetPerYear: true,
    rollPrefix: '',
    rollSeqLength: 2,
    sampleClass: '7',
    sampleSection: 'B',
    resetPerClass: true
  };

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
    this.loadUsers();
    this.loadSubscription();
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
        if (tenant.idTemplates) {
          this.templates = {
            ...this.templates,
            ...tenant.idTemplates,
          };
        }
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

  saveTemplates(): void {
    this.templatesSaving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.tenantSettingsService.updateSettings({
      idTemplates: { ...this.templates },
    }).subscribe({
      next: (tenant) => {
        this.templatesSaving.set(false);
        if (tenant.idTemplates) {
          this.templates = { ...this.templates, ...tenant.idTemplates };
        }
        this.success.set('Templates saved');
      },
      error: (err) => {
        this.templatesSaving.set(false);
        this.error.set(err.error?.message || 'Failed to save templates');
      },
    });
  }

  get admissionPreview(): string {
    const year = this.templates.includeYear ? new Date().getFullYear().toString() : '';
    const seq = String(42).padStart(this.templates.admissionSeqLength, '0');
    return [this.templates.admissionPrefix, year, seq].filter(Boolean).join('-');
  }

  get rollPreview(): string {
    const seq = String(15).padStart(this.templates.rollSeqLength, '0');
    const classSection = `${this.templates.sampleClass || '7'}${this.templates.sampleSection || ''}`;
    return [this.templates.rollPrefix, `${classSection}-${seq}`].filter(Boolean).join('').replace('--', '-');
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
    const trimmedEmail = this.inviteEmail.trim();
    if (!this.isValidEmail(trimmedEmail)) {
      this.error.set('Enter a valid email to invite');
      return;
    }
    if (!this.selectedRoles().length) {
      this.error.set('Select at least one role');
      return;
    }
    this.inviteLoading.set(true);
    const roles = this.selectedRoles().map(r => r.name);
    this.invitationService.create(trimmedEmail, roles).subscribe({
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
    const trimmedEmail = this.userForm.email.trim();
    if (!this.isValidEmail(trimmedEmail)) {
      this.error.set('Enter a valid user email');
      this.userSaving.set(false);
      return;
    }
    const selectedRoleId = this.userRoles().length ? this.userRoles()[0].id : undefined;
    const payload = {
      name: this.userForm.name,
      email: trimmedEmail,
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

  getInitial(value?: string | null): string {
    const cleaned = (value || '').trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() : '?';
  }

  getAvatarColor(seed?: string | null): string {
    const palette = ['#8b5cf6', '#22c55e', '#0ea5e9', '#f59e0b', '#ec4899', '#14b8a6'];
    if (!seed) return palette[0];
    const code = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[code % palette.length];
  }

  roleChipClass(role: string): string {
    const value = (role || '').toLowerCase();
    if (value.includes('admin')) return 'admin';
    if (value.includes('principal')) return 'principal';
    if (value.includes('teacher')) return 'teacher';
    if (value.includes('manager') || value.includes('head')) return 'manager';
    return 'neutral';
  }

  statusLabel(status: InvitationStatus): string {
    const labels: Record<InvitationStatus, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      expired: 'Expired',
      revoked: 'Revoked',
      sent: 'Sent',
    };
    return labels[status] || status;
  }

  statusClass(status: InvitationStatus): string {
    return `status-pill ${status}`;
  }

  expiryPercent(inv: Invitation): number {
    const start = inv.createdAt ? new Date(inv.createdAt).getTime() : 0;
    const end = inv.expiresAt ? new Date(inv.expiresAt).getTime() : 0;
    if (!start || !end || end <= start) return 100;
    const now = Date.now();
    const span = end - start;
    const elapsed = Math.min(Math.max(now - start, 0), span);
    return Math.min(100, Math.round((elapsed / span) * 100));
  }

  isValidEmail(email: string): boolean {
    const value = (email || '').trim();
    return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
