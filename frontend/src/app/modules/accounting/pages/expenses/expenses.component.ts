import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyDisplayComponent } from '../../../../shared/components/currency-display/currency-display.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';

interface ExpenseLine {
  vendor?: string;
  description?: string;
  account?: string;
  amount?: number;
  tax?: number;
  attachment?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyDisplayComponent, AmountInputComponent],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Expenses</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting · Expenses</p>
          <h1 class="card-title">Expense Entry</h1>
          <p class="sub">Capture multi-line expenses with vendor, allocation, tax, and attachments.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="reset()">Reset</button>
          <button class="btn primary" (click)="submit()">Submit for Approval</button>
        </div>
      </header>

      <section class="card header-form">
        <div class="form-grid">
          <label>Date
            <input type="date" [(ngModel)]="header.date" />
          </label>
          <label>Vendor
            <input [(ngModel)]="header.vendor" list="vendors" placeholder="Start typing vendor" />
            <datalist id="vendors">
              <option *ngFor="let v of vendorOptions" [value]="v"></option>
            </datalist>
          </label>
          <label>Reference
            <input [(ngModel)]="header.reference" placeholder="e.g., BILL-204" />
          </label>
          <label>Status
            <span class="pill sm" [class.draft]="status==='draft'" [class.pending]="status==='pending'" [class.approved]="status==='approved'">
              {{ status | titlecase }}
            </span>
          </label>
        </div>
        <label class="full">Memo
          <input [(ngModel)]="header.memo" placeholder="What is this expense for?" />
        </label>
      </section>

      <section class="card table">
        <div class="table-head">
          <span>#</span>
          <span>Vendor</span>
          <span>Description</span>
          <span>Account</span>
          <span>Amount</span>
          <span>Tax</span>
          <span>Attachment</span>
          <span></span>
        </div>
        <div class="table-row" *ngFor="let line of lines; let i = index">
          <span>{{ i + 1 }}</span>
          <input [(ngModel)]="line.vendor" list="vendors" placeholder="Vendor" />
          <input [(ngModel)]="line.description" placeholder="Description" />
          <select [(ngModel)]="line.account">
            <option value="">Select account</option>
            <option *ngFor="let a of accounts" [value]="a">{{ a }}</option>
          </select>
          <app-amount-input [(ngModel)]="line.amount"></app-amount-input>
          <input type="number" min="0" max="100" [(ngModel)]="line.tax" placeholder="%"/>
          <div class="attach">
            <button class="chip ghost small" type="button">Upload</button>
            <span class="muted">{{ line.attachment || 'None' }}</span>
          </div>
          <button class="chip ghost small" type="button" (click)="removeLine(i)">Remove</button>
        </div>
        <div class="table-row add-row">
          <button class="btn ghost small" type="button" (click)="addLine()">+ Add line</button>
        </div>
      </section>

      <section class="card summary">
        <div class="summary-grid">
          <div>
            <p class="muted">Subtotal</p>
            <app-currency [amount]="subtotal"></app-currency>
          </div>
          <div>
            <p class="muted">Estimated Tax</p>
            <app-currency [amount]="taxTotal"></app-currency>
          </div>
          <div>
            <p class="muted strong">Total</p>
            <app-currency [amount]="grandTotal"></app-currency>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.75rem; }
    .header-form .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:0.75rem; }
    .header-form input, .header-form select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .header-form .full { grid-column:1/-1; }
    .pill.sm { padding:0.3rem 0.7rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); font-weight:700; }
    .pill.draft { color: var(--color-text-secondary); }
    .pill.pending { color: var(--color-warning,#fbbf24); }
    .pill.approved { color: var(--color-success,#22c55e); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 0.5fr 1.5fr 2fr 1.4fr 1fr 0.7fr 1.4fr 0.8fr; gap:0.5rem; padding:0.6rem 0.8rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .table input, .table select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.45rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .attach { display:flex; gap:0.5rem; align-items:center; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:12px; background: var(--color-surface-hover); cursor:pointer; color: var(--color-text-primary); font-weight:600; }
    .chip.small { padding:0.25rem 0.6rem; font-size:0.85rem; }
    .add-row { background: var(--color-surface-hover); }
    .summary-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:0.75rem; }
    .muted { color: var(--color-text-secondary); }
    .muted.strong { font-weight:700; color: var(--color-text-primary); }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class ExpensesComponent {
  header = { date: new Date().toISOString().slice(0,10), vendor: '', reference: '', memo: '' };
  status: 'draft' | 'pending' | 'approved' = 'draft';
  vendorOptions = ['ABC Supplies', 'Green Transport', 'City Utilities', 'Campus Catering'];
  accounts = ['5010 · Salaries', '5020 · Utilities', '5030 · Supplies', '5040 · Maintenance', '2000 · Accounts Payable'];
  lines: ExpenseLine[] = [
    { vendor: 'ABC Supplies', description: 'Lab materials', account: '5030 · Supplies', amount: 320, tax: 7 },
    { vendor: 'City Utilities', description: 'Electricity bill', account: '5020 · Utilities', amount: 180, tax: 5 }
  ];

  get subtotal(): number {
    return this.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  get taxTotal(): number {
    return this.lines.reduce((sum, l) => {
      const amt = Number(l.amount) || 0;
      const t = Number(l.tax) || 0;
      return sum + +(amt * (t / 100)).toFixed(2);
    }, 0);
  }

  get grandTotal(): number {
    return +(this.subtotal + this.taxTotal).toFixed(2);
  }

  addLine() {
    this.lines = [...this.lines, {}];
  }

  removeLine(i: number) {
    this.lines = this.lines.filter((_, idx) => idx !== i);
  }

  reset() {
    this.header = { date: new Date().toISOString().slice(0,10), vendor: '', reference: '', memo: '' };
    this.lines = [];
  }

  submit() {
    this.status = 'pending';
    const entry = {
      header: { ...this.header, status: this.status },
      lines: this.lines,
      subtotal: this.subtotal,
      taxTotal: this.taxTotal,
      total: this.grandTotal
    };
    // mock save
    this.status = 'approved';
    this.header = { date: new Date().toISOString().slice(0,10), vendor: '', reference: '', memo: '' };
    this.lines = [];
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }
}
