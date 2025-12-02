import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyDisplayComponent } from '../../../../shared/components/currency-display/currency-display.component';

interface ReconRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  matched?: boolean;
}

@Component({
  selector: 'app-bank-recon',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyDisplayComponent],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Bank Reconciliation</span>
      </nav>

      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting · Banking</p>
          <h1 class="card-title">Bank Reconciliation</h1>
          <p class="sub">Match bank statement lines to books and track reconciling items.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="reset()">Reset</button>
          <button class="btn primary" (click)="autoMatch()">Auto-match</button>
        </div>
      </header>

      <section class="card filters">
        <div class="filter-grid">
          <label>Bank account
            <select [(ngModel)]="accountFilter">
              <option *ngFor="let a of accounts" [value]="a">{{ a }}</option>
            </select>
          </label>
          <label>Statement from
            <input type="date" [(ngModel)]="from" />
          </label>
          <label>To
            <input type="date" [(ngModel)]="to" />
          </label>
        </div>
      </section>

      <section class="grid">
        <div class="card table">
          <div class="card-header">
            <h3 class="card-title">Bank Statement</h3>
            <span class="muted">Balance: <app-currency [amount]="statementBalance"></app-currency></span>
          </div>
          <div class="table-head">
            <span><input type="checkbox" [(ngModel)]="selectAllStatement" (change)="toggleAll('statement')" /></span>
            <span>Date</span><span>Description</span><span>Amount</span><span>Status</span>
          </div>
          <div class="table-row" *ngFor="let s of statement">
            <span><input type="checkbox" [(ngModel)]="s.matched" /></span>
            <span>{{ s.date | date:'MMM d, y' }}</span>
            <span>{{ s.description }}</span>
            <span><app-currency [amount]="s.amount"></app-currency></span>
            <span class="pill sm" [class.match]="s.matched" [class.unmatch]="!s.matched">{{ s.matched ? 'Matched' : 'Unmatched' }}</span>
          </div>
        </div>

        <div class="card table">
          <div class="card-header">
            <h3 class="card-title">Books (General Ledger)</h3>
            <span class="muted">Balance: <app-currency [amount]="booksBalance"></app-currency></span>
          </div>
          <div class="table-head">
            <span><input type="checkbox" [(ngModel)]="selectAllBooks" (change)="toggleAll('books')" /></span>
            <span>Date</span><span>Description</span><span>Amount</span><span>Status</span>
          </div>
          <div class="table-row" *ngFor="let b of books">
            <span><input type="checkbox" [(ngModel)]="b.matched" /></span>
            <span>{{ b.date | date:'MMM d, y' }}</span>
            <span>{{ b.description }}</span>
            <span><app-currency [amount]="b.amount"></app-currency></span>
            <span class="pill sm" [class.match]="b.matched" [class.unmatch]="!b.matched">{{ b.matched ? 'Matched' : 'Unmatched' }}</span>
          </div>
        </div>
      </section>

      <section class="card summary">
        <div class="summary-grid">
          <div>
            <p class="muted">Statement Balance</p>
            <app-currency [amount]="statementBalance" [strong]="true"></app-currency>
          </div>
          <div>
            <p class="muted">Book Balance</p>
            <app-currency [amount]="booksBalance" [strong]="true"></app-currency>
          </div>
          <div>
            <p class="muted">Difference</p>
            <app-currency [amount]="difference" [strong]="true" [muted]="difference===0"></app-currency>
          </div>
          <div>
            <p class="muted">Matched</p>
            <p class="value">{{ matchedCount }} items</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
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
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 0.5fr 1.1fr 2fr 1.2fr 1fr; gap:0.5rem; padding:0.6rem 0.8rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill.sm { padding:0.2rem 0.6rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); font-weight:700; font-size:0.8rem; text-align:center; }
    .pill.match { color: var(--color-success,#22c55e); }
    .pill.unmatch { color: var(--color-text-secondary); }
    .summary-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    .value { font-weight:700; color: var(--color-text-primary); margin:0; }
    .muted { color: var(--color-text-secondary); }
  `]
})
export class BankReconComponent {
  accounts = ['Main Bank · 1020', 'Collections Bank · 1030'];
  accountFilter = this.accounts[0];
  from = '';
  to = '';
  selectAllStatement = false;
  selectAllBooks = false;

  statement: ReconRow[] = [
    { id: 's1', date: '2025-02-04', description: 'Parent payment', amount: 420, matched: true },
    { id: 's2', date: '2025-02-05', description: 'Bus contractor', amount: -180, matched: false },
    { id: 's3', date: '2025-02-06', description: 'Cafeteria deposit', amount: 250, matched: false },
  ];

  books: ReconRow[] = [
    { id: 'b1', date: '2025-02-04', description: 'Tuition receipt RCPT-204', amount: 420, matched: true },
    { id: 'b2', date: '2025-02-05', description: 'Transport vendor BILL-1002', amount: -180, matched: false },
    { id: 'b3', date: '2025-02-06', description: 'Meal sales', amount: 240, matched: false },
  ];

  get statementBalance(): number {
    return this.statement.reduce((s, r) => s + r.amount, 0);
  }

  get booksBalance(): number {
    return this.books.reduce((s, r) => s + r.amount, 0);
  }

  get difference(): number {
    return +(this.statementBalance - this.booksBalance).toFixed(2);
  }

  get matchedCount(): number {
    return [...this.statement, ...this.books].filter(r => r.matched).length;
  }

  toggleAll(source: 'statement' | 'books') {
    if (source === 'statement') {
      this.statement = this.statement.map(r => ({ ...r, matched: this.selectAllStatement }));
    } else {
      this.books = this.books.map(r => ({ ...r, matched: this.selectAllBooks }));
    }
  }

  reset() {
    this.accountFilter = this.accounts[0];
    this.from = '';
    this.to = '';
    this.selectAllStatement = false;
    this.selectAllBooks = false;
    this.statement = this.statement.map(r => ({ ...r, matched: r.id === 's1' }));
    this.books = this.books.map(r => ({ ...r, matched: r.id === 'b1' }));
  }

  autoMatch() {
    // mock auto-match: mark same absolute amounts as matched
    const amounts = new Set(this.statement.map(s => Math.abs(s.amount)));
    this.books = this.books.map(b => ({ ...b, matched: amounts.has(Math.abs(b.amount)) }));
    this.statement = this.statement.map(s => ({ ...s, matched: true }));
  }
}
