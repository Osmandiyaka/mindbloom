import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantSettingsService, TenantSettings } from '../../../../core/services/tenant-settings.service';

@Component({
    selector: 'app-tenant-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="tenant-settings">
      <div class="page-header">
        <div>
          <p class="eyebrow">Tenant</p>
          <h1>Branding & Locale</h1>
          <p class="subtitle">Control how your school appears and set regional defaults.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="reset()" [disabled]="loading()">Reset</button>
          <button class="btn primary" (click)="save()" [disabled]="loading() || saving()">
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-header">
            <h2>Brand</h2>
            <p>Logo and color palette reflected in the app chrome.</p>
          </div>
          <div class="card-body form-grid">
            <label>
              <span>Logo URL</span>
              <input type="text" [(ngModel)]="draft.customization.logo" placeholder="https://yourcdn/logo.png" />
            </label>

            <div class="color-row">
              <label>
                <span>Primary Color</span>
                <input type="color" [(ngModel)]="draft.customization.primaryColor" />
              </label>
              <label>
                <span>Secondary Color</span>
                <input type="color" [(ngModel)]="draft.customization.secondaryColor" />
              </label>
              <label>
                <span>Accent Color</span>
                <input type="color" [(ngModel)]="draft.customization.accentColor" />
              </label>
            </div>

            <div class="logo-preview" *ngIf="draft.customization.logo">
              <span>Preview</span>
              <img [src]="draft.customization.logo" alt="Logo preview" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Locale & Time</h2>
            <p>Defaults for dates, weeks, and currency across your tenant.</p>
          </div>
          <div class="card-body form-grid">
            <label>
              <span>Locale</span>
              <input type="text" [(ngModel)]="draft.locale" placeholder="en-US" />
            </label>
            <label>
              <span>Timezone</span>
              <input type="text" [(ngModel)]="draft.timezone" placeholder="America/New_York" />
            </label>
            <label>
              <span>Week Starts On</span>
              <select [(ngModel)]="draft.weekStartsOn">
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </label>
            <label>
              <span>Currency</span>
              <input type="text" [(ngModel)]="draft.currency" placeholder="USD" />
            </label>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Academic Calendar</h2>
            <p>Set start and end dates for reporting and scheduling.</p>
          </div>
          <div class="card-body form-grid">
            <label>
              <span>Academic Year Start</span>
              <input type="date" [(ngModel)]="draft.academicYear.start" />
            </label>
            <label>
              <span>Academic Year End</span>
              <input type="date" [(ngModel)]="draft.academicYear.end" />
            </label>
          </div>
        </div>

        <div class="card usage">
          <div class="card-header">
            <h2>Plan & Usage</h2>
            <p>Monitor current plan and consumption.</p>
          </div>
          <div class="card-body">
            <div class="usage-row">
              <div>
                <p class="label">Plan</p>
                <p class="value">{{ planLabel }}</p>
              </div>
              <button class="btn ghost small">Manage Plan</button>
            </div>
            <div class="usage-row">
              <div>
                <p class="label">Users</p>
                <p class="value">{{ usage.users.used }}/{{ usage.users.limit || '∞' }}</p>
              </div>
            </div>
            <div class="usage-row">
              <div>
                <p class="label">Storage</p>
                <p class="value">{{ usage.storage.used }} / {{ usage.storage.limit }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="alert" *ngIf="error()">
        <span>{{ error() }}</span>
      </div>
      <div class="alert success" *ngIf="success()">
        <span>{{ success() }}</span>
      </div>
    </div>
  `,
    styles: [`
    .tenant-settings {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-size: 12px; margin: 0 0 4px 0; }
    h1 { margin: 0; }
    .subtitle { margin: 4px 0 0 0; color: var(--color-text-secondary); }
    .actions { display: flex; gap: 0.75rem; }
    .btn { padding: 0.65rem 1.25rem; border-radius: 10px; border: 1px solid var(--color-border); cursor: pointer; }
    .btn.ghost { background: var(--color-surface); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; border: none; box-shadow: var(--shadow-md); }
    .btn.small { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
    .card-header { padding: 1.25rem 1.25rem 0.5rem 1.25rem; }
    .card-body { padding: 0 1.25rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--color-text-secondary); }
    input, select { padding: 0.65rem 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-primary); }
    .color-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap: 0.75rem; }
    .logo-preview { display: flex; flex-direction: column; gap: 0.5rem; }
    .logo-preview img { max-height: 80px; max-width: 200px; object-fit: contain; border: 1px dashed var(--color-border); padding: 6px; border-radius: 8px; }
    .usage-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 1px solid var(--color-border); }
    .usage-row:first-of-type { border-top: none; }
    .label { color: var(--color-text-secondary); margin: 0; }
    .value { margin: 2px 0 0 0; font-weight: 600; }
    .alert { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(var(--color-error-rgb,239,68,68),0.08); color: var(--color-error); }
    .alert.success { background: rgba(var(--color-success-rgb,16,185,129),0.08); color: var(--color-success); }
  `]
})
export class TenantSettingsComponent implements OnInit {
    loading = signal(false);
    saving = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    draft: TenantSettings = {
        customization: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            accentColor: '#1EA7FF',
        },
        locale: 'en-US',
        timezone: 'UTC',
        weekStartsOn: 'monday',
        currency: 'USD',
        academicYear: { start: '', end: '' },
    };

    usage = {
        users: { used: 24, limit: 100 },
        storage: { used: '2.1 GB', limit: '10 GB' },
    };

    planLabel = 'Premium';

    constructor(private tenantSettingsService: TenantSettingsService) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);
        this.tenantSettingsService.getSettings().subscribe({
            next: (settings) => {
                this.draft = {
                    ...this.draft,
                    ...settings,
                    customization: { ...this.draft.customization, ...(settings.customization || {}) },
                    academicYear: settings.academicYear || { start: '', end: '' },
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
        this.tenantSettingsService.updateSettings(this.draft).subscribe({
            next: (settings) => {
                this.success.set('Settings saved');
                this.draft = {
                    ...this.draft,
                    ...settings,
                    customization: { ...this.draft.customization, ...(settings.customization || {}) },
                    academicYear: settings.academicYear || { start: '', end: '' },
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
}
