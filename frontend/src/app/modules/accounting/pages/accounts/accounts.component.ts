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
        <div class="header-actions">
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
          <button class="btn primary" type="button" (click)="openAdd()">
            <span class="icon">➕</span> Add Account
          </button>
        </div>
      </header>

      <section class="summary card">
        <div class="summary-grid">
          <div *ngFor="let m of metrics" class="summary-chip">
            <div class="label">{{ m.label }}</div>
            <div class="value">{{ m.value }}</div>
            <div class="muted">{{ m.meta }}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Accounts</h3>
          <span class="muted">Drag-and-drop concept shown; backend wiring to follow.</span>
        </div>
        <div class="tree">
          <div *ngFor="let node of filteredAccounts" class="tree-node">
            <div class="tree-row">
              <div class="row-main">
                <span class="handle">↕</span>
                <button class="disclosure" (click)="toggle(node.code)" aria-label="Toggle">
                  {{ isExpanded(node.code) ? '▾' : '▸' }}
                </button>
                <span class="code">{{ node.code }}</span>
                <span class="name">{{ node.name }}</span>
              </div>
              <span class="pill">{{ node.type | titlecase }}</span>
              <span class="muted">{{ node.category || '—' }}</span>
              <span class="balance" [class.negative]="(node.balance||0) < 0">{{ node.balance || 0 | number:'1.0-0' }}</span>
              <div class="row-actions">
                <button class="chip ghost" (click)="startEdit(node)">Edit</button>
                <button class="chip" (click)="toggleActive(node)">{{ node.active === false ? 'Activate' : 'Deactivate' }}</button>
              </div>
            </div>
            <div class="tree-children" *ngIf="node.children?.length && isExpanded(node.code)">
              <div *ngFor="let child of node.children" class="tree-row child">
                <div class="row-main">
                  <span class="handle">↕</span>
                  <span class="code">{{ child.code }}</span>
                  <span class="name">{{ child.name }}</span>
                </div>
                <span class="pill">{{ child.type | titlecase }}</span>
                <span class="muted">{{ child.category || '—' }}</span>
                <span class="balance" [class.negative]="(child.balance||0) < 0">{{ child.balance || 0 | number:'1.0-0' }}</span>
                <div class="row-actions">
                  <button class="chip ghost" (click)="startEdit(child)">Edit</button>
                  <button class="chip" (click)="toggleActive(child)">{{ child.active === false ? 'Activate' : 'Deactivate' }}</button>
                </div>
              </div>
            </div>
          </div>
          <div class="empty" *ngIf="!filteredAccounts.length">
            <p>No accounts match your filter.</p>
            <button class="btn ghost" (click)="clearFilters()">Clear filters</button>
          </div>
        </div>
      </section>

      <div class="modal-backdrop" *ngIf="editing" (click)="closeEdit()"></div>
      <div class="modal edit-modal" *ngIf="editing">
        <div class="modal-header">
          <h3>Edit Account</h3>
          <button class="chip" (click)="closeEdit()">✕</button>
        </div>
        <form class="form-grid" (ngSubmit)="saveEdit()">
          <label>Code
            <input [(ngModel)]="editForm.code" name="codeEdit" disabled />
          </label>
          <label>Name
            <input [(ngModel)]="editForm.name" name="nameEdit" required />
          </label>
          <label>Type
            <select [(ngModel)]="editForm.type" name="typeEdit" required>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>Category
            <select [(ngModel)]="editForm.category" name="categoryEdit">
              <option value="">Select</option>
              <option *ngFor="let cat of categoryOptions(editForm.type)" [value]="cat">{{ cat }}</option>
            </select>
          </label>
          <div class="actions">
            <button type="submit" class="btn primary">Save</button>
            <button type="button" class="btn ghost" (click)="closeEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <div class="modal-backdrop" *ngIf="adding" (click)="closeAdd()"></div>
      <div class="modal edit-modal" *ngIf="adding">
        <div class="modal-header">
          <h3>Add Account</h3>
          <button class="chip" (click)="closeAdd()">✕</button>
        </div>
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
          <label>Category
            <select [(ngModel)]="form.category" name="category">
              <option value="">Select</option>
              <option *ngFor="let cat of categoryOptions(form.type)" [value]="cat">{{ cat }}</option>
            </select>
          </label>
          <label>Parent Code
            <input [(ngModel)]="form.parentCode" name="parentCode" placeholder="Optional" />
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Add</button>
            <button type="button" class="btn ghost" (click)="closeAdd()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .header-actions { display:flex; gap:0.75rem; align-items:flex-start; flex-wrap:wrap; justify-content:flex-end; }
    .filters { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
    .filters input, .filters select { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem 0.75rem; background: var(--color-surface); color: var(--color-text-primary); min-width:220px; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .summary { padding:0.75rem 1rem; }
    .summary-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    .summary-chip { background: var(--color-surface-hover); border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; }
    .summary-chip .label { color: var(--color-text-secondary); font-weight:600; }
    .summary-chip .value { font-weight:800; color: var(--color-text-primary); font-size:1.1rem; }
    .summary-chip .muted { color: var(--color-text-secondary); }
    .tree { display:flex; flex-direction:column; gap:0.35rem; }
    .tree-row { display:grid; grid-template-columns: 1.8fr 0.8fr 1fr 0.8fr 0.9fr; gap:0.5rem; align-items:center; padding:0.55rem 0.65rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-surface-hover); }
    .tree-row.child { margin-left: 1.5rem; background: var(--color-surface); }
    .row-main { display:flex; gap:0.35rem; align-items:center; }
    .handle { color: var(--color-text-secondary); }
    .disclosure { border:none; background: transparent; color: var(--color-text-secondary); cursor:pointer; font-size:0.9rem; }
    .code { font-weight:700; color: var(--color-text-primary); }
    .name { color: var(--color-text-secondary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface); }
    .balance { font-weight:600; color: var(--color-text-primary); text-align:right; }
    .negative { color: var(--color-error,#ef4444); }
    .muted { color: var(--color-text-secondary); }
    .row-actions { display:flex; gap:0.35rem; justify-content:flex-end; }
    .chip.ghost { background: transparent; }
    .empty { text-align:center; padding:1rem; color: var(--color-text-secondary); display:flex; flex-direction:column; gap:0.5rem; align-items:center; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:10; }
    .edit-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background: var(--color-surface); border:1px solid var(--color-border); border-radius:14px; padding:1rem; width:min(520px, 90vw); z-index:11; box-shadow: var(--shadow-lg); }
    .edit-modal .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
  `]
})
export class AccountsComponent {
  form: Account = { code: '', name: '', type: 'asset' };
  search = '';
  typeFilter = '';
  expanded = new Set<string>();
  editing = false;
  editForm: Account = { code: '', name: '', type: 'asset' };
  adding = false;

  constructor(public accounting: AccountingService) {}

  ngOnInit() {
    // expand all by default
    this.expandAll();
  }

  addAccount() {
    if (!this.form.code || !this.form.name) return;
    this.accounting.createAccount({ ...this.form });
    this.form = { code: '', name: '', type: 'asset' };
    this.adding = false;
  }

  categoryOptions(type: string) {
    const categories: Record<string, string[]> = {
      asset: ['Current Asset', 'Fixed Asset', 'Other Asset'],
      liability: ['Current Liability', 'Long-term Liability', 'Other Liability'],
      equity: ['Equity'],
      income: ['Income'],
      expense: ['Expense']
    };
    return categories[type] || [];
  }

  toggle(code: string) {
    if (this.expanded.has(code)) {
      this.expanded.delete(code);
    } else {
      this.expanded.add(code);
    }
  }

  isExpanded(code: string) {
    return this.expanded.has(code);
  }

  expandAll() {
    const addCodes = (nodes: AccountNode[]) => {
      nodes.forEach(n => {
        this.expanded.add(n.code);
        if (n.children) addCodes(n.children);
      });
    };
    addCodes(this.accounting.accounts());
  }

  clearFilters() {
    this.search = '';
    this.typeFilter = '';
  }

  startEdit(node: Account) {
    this.editing = true;
    this.editForm = { ...node };
  }

  closeEdit() {
    this.editing = false;
  }

  saveEdit() {
    this.accounting.updateAccount({ ...this.editForm });
    this.editing = false;
  }

  openAdd() {
    this.adding = true;
  }

  closeAdd() {
    this.adding = false;
  }

  toggleActive(node: Account) {
    this.accounting.toggleAccountActive(node.code);
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
    const sorted = (nodes: AccountNode[]) => [...nodes].sort((a,b)=>a.code.localeCompare(b.code, undefined, {numeric:true}));
    return sorted(this.accounting.accounts())
      .map(acc => matches(acc))
      .filter((n): n is AccountNode => !!n);
  }

  get metrics() {
    const nodes: AccountNode[] = [];
    const flatten = (arr: AccountNode[]) => arr.forEach(n => { nodes.push(n); if (n.children) flatten(n.children); });
    flatten(this.accounting.accounts());
    const byType = (type: string) => nodes.filter(n => n.type === type);
    return [
      { label: 'Assets', value: byType('asset').length.toString(), meta: 'accounts' },
      { label: 'Liabilities', value: byType('liability').length.toString(), meta: 'accounts' },
      { label: 'Income', value: byType('income').length.toString(), meta: 'accounts' },
      { label: 'Expense', value: byType('expense').length.toString(), meta: 'accounts' },
    ];
  }
}
