import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../../../core/services/fees.service';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';

@Component({
  selector: 'app-fee-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plans-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Fee Plans</h1>
          <p class="sub">Configure fee plans and amounts.</p>
        </div>
      </header>

      <section class="card form-card">
        <h3>Add Plan</h3>
        <form class="form-grid" (ngSubmit)="add()">
          <label>Name
            <input [(ngModel)]="form.name" name="name" required />
          </label>
          <label>Description
            <input [(ngModel)]="form.description" name="description" placeholder="Optional" />
          </label>
          <label>Amount
            <input type="number" min="0" step="0.01" [(ngModel)]="form.amount" name="amount" required />
          </label>
          <label>Currency
            <input [(ngModel)]="form.currency" name="currency" placeholder="USD" />
          </label>
          <label>Frequency
            <select [(ngModel)]="form.frequency" name="frequency">
              <option value="one-time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="term">Per Term</option>
            </select>
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Save Plan</button>
            <span class="muted">Use separate plans per grade or term as needed.</span>
          </div>
        </form>
      </section>

      <div class="plans-grid">
        <div class="card plan-card" *ngFor="let plan of fees.plans()">
          <div class="card-header">
            <h3>{{ plan.name }}</h3>
            <button class="chip danger" type="button" (click)="remove(plan.id)">Delete</button>
          </div>
          <p class="muted">{{ plan.description || '—' }}</p>
          <div class="meta">
            <span class="pill">{{ plan.frequency | titlecase }}</span>
            <span class="amount">{{ plan.amount | currency:plan.currency || 'USD' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .plans-page { padding:1.5rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0; color: var(--color-text-primary); }
    .sub { margin:0.35rem 0 0; color: var(--color-text-secondary); }
    .form-card { margin-bottom:1rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .plans-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; }
    .plan-card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1.25rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; }
    h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .muted { margin:0; color: var(--color-text-secondary); min-height:2.5rem; }
    .meta { display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-primary); font-weight:600; }
    .amount { font-weight:700; color: var(--color-text-primary); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
  `]
})
export class FeePlansComponent {
  form: { name: string; description: string; amount: number; currency: string; frequency: 'one-time' | 'monthly' | 'term' } = { name: '', description: '', amount: 0, currency: 'USD', frequency: 'monthly' };

  constructor(public fees: FeesService, private tenantSettings: TenantSettingsService) {
    this.tenantSettings.getSettings().subscribe(settings => {
      if (settings?.currency) {
        this.form.currency = settings.currency;
      }
    });
  }

  add() {
    if (!this.form.name || !this.form.amount) return;
    this.fees.createPlan({ ...this.form, amount: Number(this.form.amount) });
    this.form = { name: '', description: '', amount: 0, currency: 'USD', frequency: 'monthly' };
  }

  remove(id: string) {
    this.fees.deletePlan(id);
  }
}
