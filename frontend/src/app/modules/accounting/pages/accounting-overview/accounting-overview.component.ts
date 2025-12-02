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
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
      </nav>
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>Quick Links</h3>
            <p class="muted">Jump to key workflows</p>
          </div>
          <ul class="links">
            <li><a routerLink="/accounting/fee-structures">Fee Structures</a></li>
            <li><a routerLink="/accounting/fee-assignment">Fee Assignment</a></li>
            <li><a routerLink="/accounting/collection">Fee Collection</a></li>
            <li><a routerLink="/accounting/fee-reports">Fee Reports Dashboard</a></li>
            <li><a routerLink="/accounting/journals">Manual Journal</a></li>
            <li><a routerLink="/accounting/expenses">Expense Entry</a></li>
            <li><a routerLink="/accounting/bill-queue">Bill Payment Queue</a></li>
            <li><a routerLink="/accounting/bank-recon">Bank Reconciliation</a></li>
            <li><a routerLink="/accounting/accounts">Manage Accounts</a></li>
            <li><a routerLink="/accounting/trial-balance">Trial Balance</a></li>
            <li><a routerLink="/accounting/periods">Fiscal Periods</a></li>
            <li><a routerLink="/accounting/reports">Report Center</a></li>
          </ul>
        </aside>
        <div class="main">
          <header class="page-header">
            <div>
              <h1>Finance Workspace</h1>
              <p class="sub">Cash, fees, journals, and reporting—aligned to the academic year.</p>
            </div>
            <div class="actions">
              <a routerLink="/accounting/journals" class="btn primary">Post Journal</a>
              <a routerLink="/accounting/accounts" class="btn ghost">Chart of Accounts</a>
              <a routerLink="/accounting/fee-structures" class="btn ghost">Fee Structures</a>
              <a routerLink="/accounting/fee-reports" class="btn ghost">Fee Reports</a>
              <a routerLink="/accounting/expenses" class="btn ghost">Expenses</a>
              <a routerLink="/accounting/bill-queue" class="btn ghost">Bills Queue</a>
              <a routerLink="/accounting/bank-recon" class="btn ghost">Bank Recon</a>
            </div>
          </header>

          <section class="metrics">
            <div class="metric-card" *ngFor="let m of accounting.metrics()">
              <div class="metric-icon">{{ m.icon }}</div>
              <div class="metric-body">
                <p class="metric-label">{{ m.label }}</p>
                <p class="metric-value">{{ m.value }}</p>
                <p class="metric-trend">{{ m.trend }}</p>
              </div>
            </div>
          </section>

          <section class="grid">
            <div class="card wide">
              <div class="card-header">
                <h3>Cash Position</h3>
                <span class="muted">As of today</span>
              </div>
              <div class="cash-grid">
                <div class="cash-item">
                  <p class="label">Cash</p>
                  <p class="value">{{ accounting.cashPosition().cash | currency:'USD' }}</p>
                </div>
                <div class="cash-item">
                  <p class="label">Bank</p>
                  <p class="value">{{ accounting.cashPosition().bank | currency:'USD' }}</p>
                </div>
                <div class="cash-item">
                  <p class="label">A/R</p>
                  <p class="value">{{ accounting.cashPosition().ar | currency:'USD' }}</p>
                </div>
                <div class="cash-item">
                  <p class="label">A/P</p>
                  <p class="value">{{ accounting.cashPosition().ap | currency:'USD' }}</p>
                </div>
              </div>
            </div>

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
                  <span class="strong">{{ row.accountCode }} · {{ row.accountName }}</span>
                  <span>{{ row.debit | number:'1.2-2' }}</span>
                  <span>{{ row.credit | number:'1.2-2' }}</span>
                  <span [class.danger]="row.balance < 0">{{ row.balance | number:'1.2-2' }}</span>
                </div>
                <div class="table-row" *ngIf="!trialBalancePreview.length">
                  <span class="muted" style="grid-column:1/5">No posted journals yet</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .layout { display:grid; grid-template-columns: 260px 1fr; gap:1rem; align-items:start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .sidebar { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); position:sticky; top:1rem; }
    .sidebar-header h3 { margin:0; color: var(--color-text-primary); }
    .sidebar-header .muted { margin:0.1rem 0 0; }
    .main { display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); text-decoration:none; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .metrics { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; }
    .metric-card { display:flex; gap:0.75rem; padding:0.9rem 1rem; background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; box-shadow: var(--shadow-sm); align-items:center; }
    .metric-icon { font-size:1.4rem; }
    .metric-label { margin:0; font-weight:600; color: var(--color-text-secondary); }
    .metric-value { margin:0; font-size:1.25rem; font-weight:700; color: var(--color-text-primary); }
    .metric-trend { margin:0; color: var(--color-text-secondary); font-size:0.85rem; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card.wide { grid-column: span 2; }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .card-header h3 { color: var(--color-text-primary); margin:0; }
    .cash-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:0.75rem; }
    .cash-item { background: var(--color-surface-hover); border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; }
    .cash-item .label { margin:0; color: var(--color-text-secondary); font-weight:600; }
    .cash-item .value { margin:0.15rem 0 0; color: var(--color-text-primary); font-weight:700; font-size:1.1rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; padding:0.75rem 0.9rem; gap:0.5rem; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
    .table-row:nth-child(even) { background: color-mix(in srgb, var(--color-surface-hover) 60%, var(--color-surface) 40%); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .danger { color: var(--color-error,#ef4444); }
    .muted { color: var(--color-text-secondary); }
    .links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
    .links a { color: var(--color-primary,#7ab8ff); text-decoration:none; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
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
