import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../../../core/services/accounting.service';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';

@Component({
  selector: 'app-accounting-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Workspace</span>
      </nav>
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>Quick Links</h3>
            <p class="muted">Jump to key workflows</p>
          </div>
          <ul class="links">
            <li><a routerLink="/accounting/fee-structures"><span class="icon" [innerHTML]="icon('fees')"></span> Fee Structures</a></li>
            <li><a routerLink="/accounting/fee-assignment"><span class="icon" [innerHTML]="icon('assignment')"></span> Fee Assignment</a></li>
            <li><a routerLink="/accounting/collection"><span class="icon" [innerHTML]="icon('collection')"></span> Fee Collection</a></li>
            <li><a routerLink="/accounting/fee-reports"><span class="icon" [innerHTML]="icon('reports')"></span> Fee Reports Dashboard</a></li>
            <li><a routerLink="/accounting/journals"><span class="icon" [innerHTML]="icon('journal')"></span> Manual Journal</a></li>
            <li><a routerLink="/accounting/expenses"><span class="icon" [innerHTML]="icon('expense')"></span> Expense Entry</a></li>
            <li><a routerLink="/accounting/bill-queue"><span class="icon" [innerHTML]="icon('bill')"></span> Bill Payment Queue</a></li>
            <li><a routerLink="/accounting/bank-recon"><span class="icon" [innerHTML]="icon('bank')"></span> Bank Reconciliation</a></li>
            <li><a routerLink="/accounting/payroll"><span class="icon" [innerHTML]="icon('payroll')"></span> Payroll</a></li>
            <li><a routerLink="/accounting/accounts"><span class="icon" [innerHTML]="icon('accounts')"></span> Manage Accounts</a></li>
            <li><a routerLink="/accounting/trial-balance"><span class="icon" [innerHTML]="icon('trial')"></span> Trial Balance</a></li>
            <li><a routerLink="/accounting/periods"><span class="icon" [innerHTML]="icon('period')"></span> Fiscal Periods</a></li>
            <li><a routerLink="/accounting/reports"><span class="icon" [innerHTML]="icon('reports')"></span> Report Center</a></li>
          </ul>
        </aside>
        <div class="main">
          <header class="page-header">
            <div class="hero-copy">
              <p class="eyebrow">Finance Workspace</p>
              <h1>Control room for cash, fees, and reporting</h1>
              <p class="sub">Stay ahead of collections, payables, and period-close tasks.</p>
            </div>
            <div class="actions">
              <a routerLink="/accounting/journals" class="btn primary"><span class="icon" [innerHTML]="icon('journal')"></span> Post Journal</a>
              <a routerLink="/accounting/accounts" class="btn ghost"><span class="icon" [innerHTML]="icon('accounts')"></span> Chart of Accounts</a>
              <a routerLink="/accounting/fee-structures" class="btn ghost"><span class="icon" [innerHTML]="icon('fees')"></span> Fee Structures</a>
              <a routerLink="/accounting/fee-reports" class="btn ghost"><span class="icon" [innerHTML]="icon('reports')"></span> Fee Reports</a>
              <a routerLink="/accounting/expenses" class="btn ghost"><span class="icon" [innerHTML]="icon('expense')"></span> Expenses</a>
              <a routerLink="/accounting/bill-queue" class="btn ghost"><span class="icon" [innerHTML]="icon('bill')"></span> Bills Queue</a>
              <a routerLink="/accounting/bank-recon" class="btn ghost"><span class="icon" [innerHTML]="icon('bank')"></span> Bank Recon</a>
            </div>
          </header>

          <section class="tile-band">
            <div class="tile" *ngFor="let t of tiles">
              <div class="tile-top">
                <span class="tile-icon-bubble" [innerHTML]="icon(t.icon)"></span>
                <span class="pill" [class.good]="t.status==='ready'" [class.warn]="t.status==='watch'">{{ t.statusLabel }}</span>
              </div>
              <p class="tile-label">{{ t.label }}</p>
              <p class="tile-value">{{ t.value }}</p>
              <p class="tile-sub">{{ t.sub }}</p>
            </div>
          </section>

          <section class="analytics">
            <div class="card hoverable">
              <div class="card-header">
                <div>
                  <h3>Collections mix</h3>
                  <p class="muted">Today vs plan</p>
                </div>
                <a routerLink="/accounting/fee-reports" class="link">Open reports</a>
              </div>
              <div class="pie-wrap">
                <div class="pie"></div>
                <div class="legend">
                  <div *ngFor="let l of collectionLegend">
                    <span class="dot" [style.background]="l.color"></span>
                    <span class="label">{{ l.label }}</span>
                    <span class="value">{{ l.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card hoverable span-2">
              <div class="card-header">
                <div>
                  <h3>Cashflow trend</h3>
                  <p class="muted">Last 6 weeks</p>
                </div>
                <a routerLink="/accounting/bank-recon" class="link">Reconcile</a>
              </div>
              <div class="trend">
                <div class="bar" *ngFor="let b of cashTrend" [style.height.%]="b" [class.negative]="b < 0">
                  <span>{{ b >=0 ? '▲' : '▼' }}</span>
                </div>
              </div>
              <div class="cash-summary">
                <div>
                  <p class="label">Cash</p>
                  <p class="value">{{ accounting.cashPosition().cash | currency:'USD' }}</p>
                </div>
                <div>
                  <p class="label">Bank</p>
                  <p class="value">{{ accounting.cashPosition().bank | currency:'USD' }}</p>
                </div>
                <div>
                  <p class="label">A/R</p>
                  <p class="value">{{ accounting.cashPosition().ar | currency:'USD' }}</p>
                </div>
                <div>
                  <p class="label">A/P</p>
                  <p class="value">{{ accounting.cashPosition().ap | currency:'USD' }}</p>
                </div>
              </div>
            </div>

            <div class="card hoverable full-span">
              <div class="card-header">
                <h3>Trial Balance Snapshot</h3>
                <a routerLink="/accounting/trial-balance" class="link">View full</a>
              </div>
              <div class="table compact">
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

          <section class="tasks card hoverable">
            <div class="card-header">
              <h3>Workboard</h3>
              <div class="task-actions">
                <button class="chip">Group</button>
                <button class="chip">Filter</button>
                <button class="chip">Sort</button>
              </div>
            </div>
            <div class="task-table">
              <div class="task-head">
                <span>Task</span>
                <span>Status</span>
                <span>Due</span>
                <span>Area</span>
                <span>Tags</span>
              </div>
              <div class="task-row" *ngFor="let t of workItems">
                <div class="task-title">
                  <p class="strong">{{ t.title }}</p>
                  <p class="muted small">{{ t.owner }} · {{ t.assignee }}</p>
                </div>
                <span><span class="pill" [class.warn]="t.status==='Overdue'" [class.good]="t.status==='Open'">{{ t.status }}</span></span>
                <span>{{ t.due }}</span>
                <span>{{ t.area }}</span>
                <span class="tags">
                  <span class="tag" *ngFor="let tag of t.tags">{{ tag }}</span>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary,#7ab8ff) 10%, transparent), transparent), radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-warning,#eab308) 8%, transparent), transparent); }
    .layout { display:grid; grid-template-columns: 260px 1fr; gap:1.75rem; align-items:start; max-width:1440px; margin:0 auto; width:100%; }
    @media (max-width: 1024px) { .layout { grid-template-columns: 1fr; } .sidebar { position:relative; width:100%; top:auto; } }
    .sidebar { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px rgba(var(--color-primary-rgb,123,140,255),0.2); position:sticky; top:1rem; }
    .sidebar-header h3 { margin:0; color: var(--color-text-primary); }
    .sidebar-header .muted { margin:0.1rem 0 0; }
    .main { display:flex; flex-direction:column; gap:1.75rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary,#7ab8ff) 18%, transparent), transparent); border:1px solid var(--color-border); border-radius:14px; padding:1rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px rgba(var(--color-primary-rgb,123,140,255),0.2); transition: box-shadow 120ms ease, transform 120ms ease; }
    .page-header:hover { box-shadow: 0 0 15px rgba(var(--color-primary-rgb,123,140,255),0.7), inset 0 0 10px rgba(var(--color-primary-rgb,123,140,255),0.1); transform: translateY(-1px); }
    .hero-copy h1 { margin:0 0 0.35rem; color: var(--color-text-primary); text-shadow: 0 0 8px rgba(255,255,255,0.08); }
    .hero-copy .eyebrow { text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.15rem; }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; transition: filter 140ms ease; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.primary:hover { filter: brightness(1.2); }
    .btn.ghost { background: transparent; }
    .tile-band { display:grid; grid-template-columns: repeat(auto-fit,minmax(190px,1fr)); gap:1.75rem; }
    .tile { background: linear-gradient(135deg, color-mix(in srgb, var(--color-surface) 80%, transparent), color-mix(in srgb, var(--color-surface-hover) 60%, transparent)); border:1px solid var(--color-border); border-radius:12px; padding:0.85rem 1rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px rgba(var(--color-primary-rgb,123,140,255),0.2); display:flex; flex-direction:column; gap:0.35rem; transition: transform 120ms ease, box-shadow 120ms ease; }
    .tile:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(var(--color-primary-rgb,123,140,255),0.7), inset 0 0 10px rgba(var(--color-primary-rgb,123,140,255),0.1); }
    .tile-top { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
    .tile-icon-bubble { width:34px; height:34px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; background: transparent; box-shadow: 0 0 8px rgba(var(--color-primary-rgb,123,140,255),0.5); color: var(--color-primary,#7ab8ff); border:1px solid color-mix(in srgb, var(--color-primary,#7ab8ff) 60%, var(--color-border)); }
    .tile-icon-bubble svg, .icon svg { width:18px; height:18px; stroke: currentColor; fill: none; }
    .tile-label { margin:0; color: var(--color-text-secondary); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; font-size:0.85rem; }
    .tile-value { margin:0; font-size:1.35rem; font-weight:700; color: var(--color-text-primary); font-family:'Roboto Mono', monospace; text-shadow: 0 0 8px rgba(255,255,255,0.08); }
    .tile-sub { margin:0; color: var(--color-text-secondary); font-size:0.9rem; }
    .tile-icon { font-size:1.2rem; }
    .pill { padding:0.25rem 0.55rem; border-radius:999px; font-size:0.75rem; border:1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface-hover); }
    .pill.good { background: color-mix(in srgb, var(--color-success,#16a34a) 15%, transparent); color: var(--color-success,#16a34a); border-color: color-mix(in srgb, var(--color-success,#16a34a) 35%, transparent); }
    .pill.warn { background: color-mix(in srgb, var(--color-warning,#eab308) 15%, transparent); color: var(--color-warning,#eab308); border-color: color-mix(in srgb, var(--color-warning,#eab308) 35%, transparent); }
    .analytics { display:grid; grid-template-columns: repeat(3, minmax(280px,1fr)); gap:1.75rem; align-items:start; }
    .analytics .card:first-child { min-height: 340px; grid-column: span 1; }
    .span-2 { grid-column: span 2; }
    .full-span { grid-column: 1 / -1; }
    @media (max-width: 1024px) { .analytics { grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); } .span-2, .full-span { grid-column: span 1; } }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px rgba(var(--color-primary-rgb,123,140,255),0.2); }
    .hoverable { transition: transform 120ms ease, box-shadow 120ms ease; }
    .hoverable:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(var(--color-primary-rgb,123,140,255),0.7), inset 0 0 10px rgba(var(--color-primary-rgb,123,140,255),0.1); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .card-header h3 { color: var(--color-text-primary); margin:0; text-transform:uppercase; letter-spacing:0.08em; }
    .pie-wrap { display:flex; gap:1rem; align-items:center; }
    .pie { width:140px; height:140px; border-radius:50%; background: conic-gradient(#7ab8ff 0 45%, #6ee7b7 45% 75%, #fbbf24 75% 100%); box-shadow: var(--shadow-sm); }
    .legend { display:flex; flex-direction:column; gap:0.35rem; }
    .legend .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
    .legend .label { color: var(--color-text-primary); font-weight:600; margin-left:0.35rem; }
    .legend .value { color: var(--color-text-secondary); margin-left:auto; }
    .trend { display:flex; gap:0.4rem; align-items:flex-end; height:120px; margin-bottom:0.5rem; border-bottom:1px dashed color-mix(in srgb, var(--color-border) 70%, transparent); padding-bottom:0.35rem; }
    .trend .bar { flex:1; background: linear-gradient(to top, var(--color-primary-light,#9fd0ff), color-mix(in srgb, #0a1b2f 70%, transparent)); border-radius:6px 6px 2px 2px; position:relative; display:flex; align-items:flex-end; justify-content:center; color: color-mix(in srgb, var(--color-primary,#7ab8ff) 80%, #0f172a 20%); font-size:0.65rem; padding-bottom:0.25rem; box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--color-border) 40%, transparent); }
    .trend .bar span { opacity:0; transition: opacity 120ms ease; position:absolute; top:-26px; padding:0.2rem 0.5rem; border-radius:6px; background: color-mix(in srgb, var(--color-primary,#7ab8ff) 70%, #0f172a 30%); box-shadow: 0 0 8px rgba(var(--color-primary-rgb,123,140,255),0.4); color:#0f172a; }
    .trend .bar:hover span { opacity:1; }
    .trend .bar.negative { background: linear-gradient(to top, var(--color-error,#ef4444), #880000); color: var(--color-error,#ef4444); box-shadow: 0 0 8px rgba(255,85,85,0.8); }
    .cash-summary { display:grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap:0.5rem; }
    .cash-summary .label { margin:0; color: var(--color-text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; font-size:0.8rem; }
    .cash-summary .value { margin:0.1rem 0 0; color: var(--color-text-primary); font-weight:700; font-family:'Roboto Mono', monospace; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table.compact .table-head, .table.compact .table-row { padding:0.55rem 0.75rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; padding:0.75rem 0.9rem; gap:0.5rem; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
    .table-row:nth-child(even) { background: color-mix(in srgb, var(--color-surface-hover) 60%, var(--color-surface) 40%); }
    .table-head span:nth-child(n+2), .table-row span:nth-child(n+2) { font-family:'Roboto Mono', monospace; }
    .strong { font-weight:700; color: var(--color-text-primary); font-family:'Roboto Mono', monospace; }
    .danger { color: var(--color-error,#ef4444); }
    .muted { color: var(--color-text-secondary); }
    .links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
    .links a { color: var(--color-primary,#7ab8ff); text-decoration:none; display:flex; align-items:center; gap:0.5rem; }
    .links .icon { width:20px; height:20px; text-align:center; display:inline-flex; align-items:center; justify-content:center; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
    .tasks .task-actions { display:flex; gap:0.4rem; }
    .chip { padding:0.35rem 0.7rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .task-table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .task-head, .task-row { display:grid; grid-template-columns: 1.6fr 0.9fr 0.9fr 0.9fr 1fr; gap:0.5rem; padding:0.65rem 0.8rem; align-items:center; }
    .task-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .task-row { border-top:1px solid var(--color-border); background: var(--color-surface); transition: background 120ms ease; }
    .task-row:nth-child(even) { background: color-mix(in srgb, var(--color-surface-hover) 65%, var(--color-surface) 35%); }
    .task-row:hover { background: color-mix(in srgb, var(--color-surface-hover) 85%, var(--color-surface) 15%); }
    .task-title { display:flex; flex-direction:column; gap:0.15rem; }
    .task-title .small { font-size:0.85rem; }
    .tags { display:flex; gap:0.3rem; flex-wrap:wrap; }
    .tag { padding:0.15rem 0.5rem; border-radius:8px; background: color-mix(in srgb, var(--color-primary,#7ab8ff) 12%, transparent); color: var(--color-text-primary); border:1px solid var(--color-border); font-size:0.85rem; }
    .link { color: var(--color-primary,#7ab8ff); text-decoration:none; font-weight:600; }
  `]
})
export class AccountingOverviewComponent implements OnInit {
  get trialBalancePreview() {
    return this.accounting.trialBalance().slice(0, 5);
  }

  constructor(public accounting: AccountingService, private icons: IconRegistryService) { }

  tiles = [
    { label: 'Collections today', value: '$18,400', sub: '+8.5% vs plan', icon: 'collection', status: 'ready', statusLabel: 'On track' },
    { label: 'Overdue invoices', value: '42', sub: '12 due this week', icon: 'alarm', status: 'watch', statusLabel: 'Watch' },
    { label: 'Pending payments', value: '$9,250', sub: 'Bills to clear', icon: 'inbox', status: 'watch', statusLabel: 'Action' },
    { label: 'Payroll', value: '$32,000', sub: 'Next run in 5 days', icon: 'briefcase', status: 'ready', statusLabel: 'Scheduled' }
  ];

  collectionLegend = [
    { label: 'Tuition', value: '48%', color: '#7ab8ff' },
    { label: 'Transport', value: '27%', color: '#6ee7b7' },
    { label: 'Meals', value: '25%', color: '#fbbf24' }
  ];

  cashTrend = [30, 60, 45, -20, 50, 70, 40];

  workItems = [
    { title: 'Allocate last Friday receipts to invoices', owner: 'Treasury ·', assignee: 'Chidi', status: 'Open', due: 'Today', area: 'Collections', tags: ['Receipts', 'Invoices'] },
    { title: 'Review salaries accrual JV', owner: 'Controller ·', assignee: 'Moyo', status: 'Overdue', due: 'Yesterday', area: 'Payroll', tags: ['JV', 'Payroll'] },
    { title: 'Approve transport vendor bills', owner: 'AP ·', assignee: 'Amaka', status: 'Open', due: 'Feb 12', area: 'Payables', tags: ['Bills', 'Vendors'] },
    { title: 'Publish fee report for PTA', owner: 'Finance ·', assignee: 'Sara', status: 'Open', due: 'Feb 15', area: 'Reporting', tags: ['Reporting', 'PTA'] }
  ];

  ngOnInit(): void {
    this.accounting.loadTrialBalance();
  }

  icon(name: string) {
    return this.icons.icon(name);
  }
}
