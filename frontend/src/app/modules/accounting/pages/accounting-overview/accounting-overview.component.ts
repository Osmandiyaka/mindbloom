import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-accounting-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting</p>
          <h1>General Ledger</h1>
          <p class="sub">Chart of accounts, journals, and trial balance at a glance.</p>
        </div>
        <div class="actions">
          <a routerLink="/accounting/journals" class="btn primary">Post Journal</a>
          <a routerLink="/accounting/accounts" class="btn ghost">Chart of Accounts</a>
        </div>
      </header>

      <section class="grid">
        <div class="card">
          <div class="card-header">
            <h3>Trial Balance Snapshot</h3>
            <a routerLink="/accounting/trial-balance" class="link">View full</a>
          </div>
          <div class="table">
            <div class="table-head">
              <span>Account</span><span>Debit</span><span>Credit</span><span>Balance</span>
            </div>
            <div class="table-row" *ngFor="let row of trialBalancePreview">
              <span class="strong">{{ row.accountCode }}</span>
              <span>{{ row.debit | number:'1.2-2' }}</span>
              <span>{{ row.credit | number:'1.2-2' }}</span>
              <span [class.danger]="row.balance < 0">{{ row.balance | number:'1.2-2' }}</span>
            </div>
            <div class="table-row" *ngIf="!trialBalancePreview.length">
              <span class="muted" style="grid-column:1/5">No posted journals yet</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Quick Links</h3>
          </div>
          <ul class="links">
            <li><a routerLink="/fees/invoices">Fees & Invoices</a></li>
            <li><a routerLink="/accounting/journals">Manual Journal</a></li>
            <li><a routerLink="/accounting/accounts">Manage Accounts</a></li>
            <li><a routerLink="/accounting/trial-balance">Trial Balance</a></li>
            <li><a routerLink="/accounting/periods">Fiscal Periods</a></li>
          </ul>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); text-decoration:none; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; padding:0.75rem 0.9rem; gap:0.5rem; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .danger { color: var(--color-error,#ef4444); }
    .muted { color: var(--color-text-secondary); }
    .links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
    .links a { color: var(--color-primary,#7ab8ff); text-decoration:none; }
  `]
})
export class AccountingOverviewComponent implements OnInit {
  get trialBalancePreview() {
    return this.accounting.trialBalance().slice(0, 5);
  }

  constructor(public accounting: AccountingService) {}

  ngOnInit(): void {
    this.accounting.loadTrialBalance();
  }
}
