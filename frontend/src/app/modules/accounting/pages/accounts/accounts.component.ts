import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingService, Account } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting</p>
          <h1>Chart of Accounts</h1>
          <p class="sub">Manage your GL accounts for posting journals.</p>
        </div>
      </header>

      <section class="card">
        <h3>Add Account</h3>
        <form class="form-grid" (ngSubmit)="addAccount()">
          <label>Code
            <input [(ngModel)]="form.code" name="code" required />
          </label>
          <label>Name
            <input [(ngModel)]="form.name" name="name" required />
          </label>
          <label>Type
            <select [(ngModel)]="form.type" name="type" required>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>Parent Code
            <input [(ngModel)]="form.parentCode" name="parentCode" placeholder="Optional" />
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Add</button>
            <span class="muted">Use a consistent numbering scheme to group accounts.</span>
          </div>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>Accounts</h3>
        </div>
        <div class="table">
          <div class="table-head">
            <span>Code</span><span>Name</span><span>Type</span><span>Parent</span>
          </div>
          <div class="table-row" *ngFor="let acc of accounting.accounts()">
            <span class="strong">{{ acc.code }}</span>
            <span>{{ acc.name }}</span>
            <span class="pill">{{ acc.type | titlecase }}</span>
            <span>{{ acc.parentCode || '—' }}</span>
          </div>
          <div class="table-row" *ngIf="!accounting.accounts().length">
            <span class="muted" style="grid-column:1/5">No accounts yet.</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin-top:0.5rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap:0.5rem; padding:0.75rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); }
    .muted { color: var(--color-text-secondary); }
  `]
})
export class AccountsComponent {
  form: Account = { code: '', name: '', type: 'asset' };

  constructor(public accounting: AccountingService) {}

  addAccount() {
    if (!this.form.code || !this.form.name) return;
    this.accounting.createAccount({ ...this.form });
    this.form = { code: '', name: '', type: 'asset' };
  }
}
