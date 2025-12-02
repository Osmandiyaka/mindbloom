import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Trial Balance</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting</p>
          <h1>Trial Balance</h1>
          <p class="sub">Debits and credits summary by account.</p>
        </div>
        <div class="filters">
          <label>As of
            <input type="date" [(ngModel)]="asOf" (change)="refresh()" />
          </label>
        </div>
      </header>

      <div class="card">
        <div class="table">
          <div class="table-head">
            <span>Account</span><span>Debit</span><span>Credit</span><span>Balance</span>
          </div>
          <div class="table-row" *ngFor="let row of accounting.trialBalance()">
            <span class="strong">{{ row.accountCode }}</span>
            <span>{{ row.debit | number:'1.2-2' }}</span>
            <span>{{ row.credit | number:'1.2-2' }}</span>
            <span [class.danger]="row.balance < 0">{{ row.balance | number:'1.2-2' }}</span>
          </div>
          <div class="table-row totals">
            <span class="strong">Totals</span>
            <span class="strong">{{ totalDebit | number:'1.2-2' }}</span>
            <span class="strong">{{ totalCredit | number:'1.2-2' }}</span>
            <span class="strong" [class.danger]="abs(totalDebit-totalCredit) > 0.01">{{ (totalDebit-totalCredit) | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .filters label { display:flex; flex-direction:column; gap:0.25rem; font-weight:600; color: var(--color-text-primary); }
    input { border:1px solid var(--color-border); border-radius:8px; padding:0.5rem 0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; padding:0.75rem 0.9rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .danger { color: var(--color-error,#ef4444); }
    .totals { background: var(--color-surface-hover); }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class TrialBalanceComponent implements OnInit {
  asOf: string = '';

  constructor(public accounting: AccountingService) {}

  ngOnInit(): void {
    this.accounting.loadTrialBalance();
  }

  get totalDebit() {
    return this.accounting.trialBalance().reduce((s, r) => s + (r.debit || 0), 0);
  }
  get totalCredit() {
    return this.accounting.trialBalance().reduce((s, r) => s + (r.credit || 0), 0);
  }

  refresh() {
    this.accounting.loadTrialBalance(this.asOf ? new Date(this.asOf) : undefined);
  }

  abs(val: number) {
    return Math.abs(val);
  }
}
