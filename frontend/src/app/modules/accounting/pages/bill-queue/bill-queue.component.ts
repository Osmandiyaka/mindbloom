import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyDisplayComponent } from '../../../../shared/components/currency-display/currency-display.component';

interface BillRow {
  id: string;
  billNo: string;
  vendor: string;
  due: string;
  amount: number;
  status: 'draft' | 'due' | 'overdue';
  selected?: boolean;
}

@Component({
  selector: 'app-bill-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyDisplayComponent],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Bill Queue</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting · Bills</p>
          <h1 class="card-title">Bill Payment Queue</h1>
          <p class="sub">Review unpaid bills, filter by vendor and due date, and schedule payments.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="reset()">Reset</button>
          <button class="btn primary" (click)="bulkMarkPaid()">Mark Paid</button>
        </div>
      </header>

      <section class="card filters">
        <div class="card-header">
          <h3 class="card-title">Filters</h3>
        </div>
        <div class="filter-grid">
          <label>Vendor
            <input [(ngModel)]="vendorFilter" list="vendorList" placeholder="Filter vendor" />
            <datalist id="vendorList">
              <option *ngFor="let v of vendorOptions" [value]="v"></option>
            </datalist>
          </label>
          <label>From
            <input type="date" [(ngModel)]="fromDate" />
          </label>
          <label>To
            <input type="date" [(ngModel)]="toDate" />
          </label>
          <label>Status
            <select [(ngModel)]="statusFilter">
              <option value="">All</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      </section>

      <section class="card table">
        <div class="table-head">
          <span><input type="checkbox" [(ngModel)]="selectAll" (change)="toggleAll()" /></span>
          <span>Bill #</span>
          <span>Vendor</span>
          <span>Due</span>
          <span>Amount</span>
          <span>Status</span>
          <span></span>
        </div>
        <div class="table-row" *ngFor="let b of filtered">
          <span><input type="checkbox" [(ngModel)]="b.selected" /></span>
          <span class="strong">{{ b.billNo }}</span>
          <span>{{ b.vendor }}</span>
          <span>{{ b.due | date:'MMM d, y' }}</span>
          <span><app-currency [amount]="b.amount"></app-currency></span>
          <span>
            <span class="pill sm" [class.overdue]="b.status==='overdue'" [class.due]="b.status==='due'" [class.draft]="b.status==='draft'">
              {{ b.status | titlecase }}
            </span>
          </span>
          <span class="row-actions">
            <button class="chip ghost small" (click)="pay(b)">Pay</button>
            <button class="chip ghost small" (click)="view(b)">View</button>
          </span>
        </div>
        <div class="table-row" *ngIf="!filtered.length">
          <span class="muted" style="grid-column:1/8">No bills found.</span>
        </div>
      </section>

      <section class="card summary">
        <div class="summary-grid">
          <div>
            <p class="muted">Selected</p>
            <p class="value">{{ selectedCount }} bills</p>
          </div>
          <div>
            <p class="muted">Selected Amount</p>
            <app-currency [amount]="selectedAmount" [strong]="true"></app-currency>
          </div>
          <div>
            <p class="muted">Overdue</p>
            <p class="value danger">{{ overdueCount }} bills</p>
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
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .filters input, .filters select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .filter-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:0.75rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 0.6fr 1.2fr 2fr 1.4fr 1.4fr 1fr 1.2fr; gap:0.5rem; padding:0.6rem 0.8rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .danger { color: var(--color-error,#ef4444); }
    .pill.sm { padding:0.2rem 0.6rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); font-weight:700; font-size:0.8rem; }
    .pill.overdue { color: var(--color-error,#ef4444); }
    .pill.due { color: var(--color-warning,#fbbf24); }
    .pill.draft { color: var(--color-text-secondary); }
    .row-actions { display:flex; gap:0.35rem; justify-content:flex-end; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:12px; background: var(--color-surface-hover); cursor:pointer; color: var(--color-text-primary); font-weight:600; }
    .chip.small { padding:0.25rem 0.6rem; font-size:0.85rem; }
    .summary-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    .summary .value { font-weight:700; color: var(--color-text-primary); margin:0; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class BillQueueComponent {
  vendorFilter = '';
  statusFilter: '' | 'draft' | 'due' | 'overdue' = '';
  fromDate = '';
  toDate = '';
  selectAll = false;

  vendorOptions = ['ABC Supplies', 'Green Transport', 'City Utilities', 'Campus Catering'];

  bills: BillRow[] = [
    { id: 'b1', billNo: 'BILL-1001', vendor: 'ABC Supplies', due: '2025-02-10', amount: 520, status: 'due' },
    { id: 'b2', billNo: 'BILL-1002', vendor: 'City Utilities', due: '2025-02-05', amount: 180, status: 'overdue' },
    { id: 'b3', billNo: 'BILL-1003', vendor: 'Green Transport', due: '2025-02-15', amount: 340, status: 'draft' },
    { id: 'b4', billNo: 'BILL-1004', vendor: 'Campus Catering', due: '2025-02-18', amount: 920, status: 'due' },
  ];

  get filtered(): BillRow[] {
    return this.bills.filter(b => {
      const vs = this.vendorFilter ? b.vendor.toLowerCase().includes(this.vendorFilter.toLowerCase()) : true;
      const st = this.statusFilter ? b.status === this.statusFilter : true;
      const fromOk = this.fromDate ? new Date(b.due) >= new Date(this.fromDate) : true;
      const toOk = this.toDate ? new Date(b.due) <= new Date(this.toDate) : true;
      return vs && st && fromOk && toOk;
    });
  }

  get selectedCount(): number {
    return this.bills.filter(b => b.selected).length;
  }

  get selectedAmount(): number {
    return this.bills.filter(b => b.selected).reduce((sum, b) => sum + b.amount, 0);
  }

  get overdueCount(): number {
    return this.bills.filter(b => b.status === 'overdue').length;
    }

  toggleAll() {
    const val = this.selectAll;
    this.bills = this.bills.map(b => ({ ...b, selected: val }));
  }

  reset() {
    this.vendorFilter = '';
    this.statusFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectAll = false;
    this.bills = this.bills.map(b => ({ ...b, selected: false }));
  }

  bulkMarkPaid() {
    this.bills = this.bills.map(b => b.selected ? { ...b, status: 'draft', selected: false } : b);
    this.selectAll = false;
  }

  pay(bill: BillRow) {
    bill.status = 'draft';
    bill.selected = false;
  }

  view(bill: BillRow) {
    // placeholder for modal/detail view
    console.log('View bill', bill);
  }
}
