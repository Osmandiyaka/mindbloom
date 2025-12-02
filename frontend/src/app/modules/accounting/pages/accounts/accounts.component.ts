import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingService, Account, AccountNode } from '../../../../core/services/accounting.service';

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
          <p class="sub">Manage GL accounts, organized by type with quick search.</p>
        </div>
        <div class="filters">
          <input type="search" placeholder="Search code or name" [(ngModel)]="search" />
          <select [(ngModel)]="typeFilter">
            <option value="">All types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
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
          <span class="muted">Drag-and-drop concept shown; backend wiring to follow.</span>
        </div>
        <div class="tree">
          <div *ngFor="let node of filteredAccounts" class="tree-node">
            <div class="tree-row">
              <div class="row-main">
                <span class="code">{{ node.code }}</span>
                <span class="name">{{ node.name }}</span>
              </div>
              <span class="pill">{{ node.type | titlecase }}</span>
              <span class="muted">{{ node.category || '—' }}</span>
              <span class="balance" [class.negative]="(node.balance||0) < 0">{{ node.balance || 0 | number:'1.0-0' }}</span>
            </div>
            <div class="tree-children" *ngIf="node.children?.length">
              <div *ngFor="let child of node.children" class="tree-row child">
                <div class="row-main">
                  <span class="code">{{ child.code }}</span>
                  <span class="name">{{ child.name }}</span>
                </div>
                <span class="pill">{{ child.type | titlecase }}</span>
                <span class="muted">{{ child.category || '—' }}</span>
                <span class="balance" [class.negative]="(child.balance||0) < 0">{{ child.balance || 0 | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
          <div class="empty" *ngIf="!filteredAccounts.length">
            <p>No accounts match your filter.</p>
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
    .filters { display:flex; gap:0.5rem; align-items:center; }
    .filters input, .filters select { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem 0.75rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .tree { display:flex; flex-direction:column; gap:0.25rem; }
    .tree-row { display:grid; grid-template-columns: 1.6fr 0.8fr 1fr 0.8fr; gap:0.5rem; align-items:center; padding:0.55rem 0.65rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-surface-hover); }
    .tree-row.child { margin-left: 1.5rem; background: var(--color-surface); }
    .row-main { display:flex; gap:0.5rem; align-items:center; }
    .code { font-weight:700; color: var(--color-text-primary); }
    .name { color: var(--color-text-secondary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface); }
    .balance { font-weight:600; color: var(--color-text-primary); text-align:right; }
    .negative { color: var(--color-error,#ef4444); }
    .muted { color: var(--color-text-secondary); }
    .empty { text-align:center; padding:1rem; color: var(--color-text-secondary); }
  `]
})
export class AccountsComponent {
  form: Account = { code: '', name: '', type: 'asset' };
  search = '';
  typeFilter = '';

  constructor(public accounting: AccountingService) {}

  addAccount() {
    if (!this.form.code || !this.form.name) return;
    this.accounting.createAccount({ ...this.form });
    this.form = { code: '', name: '', type: 'asset' };
  }

  get filteredAccounts(): AccountNode[] {
    const matches = (node: AccountNode): AccountNode | null => {
      const term = this.search.toLowerCase();
      const hit =
        (!this.typeFilter || node.type === this.typeFilter) &&
        (!term || node.code.toLowerCase().includes(term) || node.name.toLowerCase().includes(term));
      const kids = node.children
        ?.map(child => matches(child))
        .filter((c): c is AccountNode => !!c);
      if (hit || (kids && kids.length)) {
        return { ...node, children: kids };
      }
      return null;
    };
    return this.accounting.accounts()
      .map(acc => matches(acc))
      .filter((n): n is AccountNode => !!n);
  }
}
