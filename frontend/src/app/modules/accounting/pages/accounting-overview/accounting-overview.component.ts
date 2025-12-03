import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../../../core/services/accounting.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

            <div class="card hoverable">
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

            <div class="card hoverable">
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
    .layout { display:grid; grid-template-columns: 260px 1fr; gap:1rem; align-items:start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .sidebar { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); position:sticky; top:1rem; }
    .sidebar-header h3 { margin:0; color: var(--color-text-primary); }
    .sidebar-header .muted { margin:0.1rem 0 0; }
    .main { display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary,#7ab8ff) 18%, transparent), transparent); border:1px solid var(--color-border); border-radius:14px; padding:1rem; box-shadow: var(--shadow-sm); }
    .hero-copy h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .hero-copy .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.15rem; }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .tile-band { display:grid; grid-template-columns: repeat(auto-fit,minmax(190px,1fr)); gap:0.75rem; }
    .tile { background: linear-gradient(135deg, color-mix(in srgb, var(--color-surface) 80%, transparent), color-mix(in srgb, var(--color-surface-hover) 60%, transparent)); border:1px solid var(--color-border); border-radius:12px; padding:0.85rem 1rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.35rem; transition: transform 120ms ease, box-shadow 120ms ease; }
    .tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-md, 0 12px 28px rgba(0,0,0,0.18)); }
    .tile-top { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
    .tile-icon-bubble { width:34px; height:34px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; background: color-mix(in srgb, var(--color-primary,#7ab8ff) 20%, transparent); box-shadow: inset 0 0 0 1px var(--color-border); color: var(--color-text-primary); }
    .tile-icon-bubble svg, .icon svg { width:18px; height:18px; stroke: currentColor; fill: none; }
    .tile-label { margin:0; color: var(--color-text-secondary); font-weight:600; }
    .tile-value { margin:0; font-size:1.35rem; font-weight:700; color: var(--color-text-primary); }
    .tile-sub { margin:0; color: var(--color-text-secondary); font-size:0.9rem; }
    .tile-icon { font-size:1.2rem; }
    .pill { padding:0.25rem 0.55rem; border-radius:999px; font-size:0.75rem; border:1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface-hover); }
    .pill.good { background: color-mix(in srgb, var(--color-success,#16a34a) 15%, transparent); color: var(--color-success,#16a34a); border-color: color-mix(in srgb, var(--color-success,#16a34a) 35%, transparent); }
    .pill.warn { background: color-mix(in srgb, var(--color-warning,#eab308) 15%, transparent); color: var(--color-warning,#eab308); border-color: color-mix(in srgb, var(--color-warning,#eab308) 35%, transparent); }
    .analytics { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .hoverable { transition: transform 120ms ease, box-shadow 120ms ease; }
    .hoverable:hover { transform: translateY(-2px); box-shadow: var(--shadow-md, 0 12px 28px rgba(0,0,0,0.18)); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .card-header h3 { color: var(--color-text-primary); margin:0; }
    .pie-wrap { display:flex; gap:1rem; align-items:center; }
    .pie { width:140px; height:140px; border-radius:50%; background: conic-gradient(#7ab8ff 0 45%, #6ee7b7 45% 75%, #fbbf24 75% 100%); box-shadow: var(--shadow-sm); }
    .legend { display:flex; flex-direction:column; gap:0.35rem; }
    .legend .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
    .legend .label { color: var(--color-text-primary); font-weight:600; margin-left:0.35rem; }
    .legend .value { color: var(--color-text-secondary); margin-left:auto; }
    .trend { display:flex; gap:0.4rem; align-items:flex-end; height:120px; margin-bottom:0.5rem; }
    .trend .bar { flex:1; background: linear-gradient(180deg, color-mix(in srgb, var(--color-primary,#7ab8ff) 80%, transparent), transparent); border-radius:6px 6px 2px 2px; position:relative; display:flex; align-items:flex-end; justify-content:center; color: color-mix(in srgb, var(--color-primary,#7ab8ff) 80%, #0f172a 20%); font-size:0.65rem; padding-bottom:0.25rem; box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--color-border) 40%, transparent); }
    .trend .bar.negative { background: linear-gradient(180deg, color-mix(in srgb, var(--color-error,#ef4444) 70%, transparent), transparent); color: var(--color-error,#ef4444); }
    .cash-summary { display:grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap:0.5rem; }
    .cash-summary .label { margin:0; color: var(--color-text-secondary); font-weight:600; }
    .cash-summary .value { margin:0.1rem 0 0; color: var(--color-text-primary); font-weight:700; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table.compact .table-head, .table.compact .table-row { padding:0.55rem 0.75rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; padding:0.75rem 0.9rem; gap:0.5rem; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
    .table-row:nth-child(even) { background: color-mix(in srgb, var(--color-surface-hover) 60%, var(--color-surface) 40%); }
    .strong { font-weight:700; color: var(--color-text-primary); }
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

  constructor(public accounting: AccountingService, private sanitizer: DomSanitizer) {
    this.registerIcons();
  }

  tiles = [
    { label: 'Collections today', value: '$18,400', sub: '+8.5% vs plan', icon: 'collection', status: 'ready', statusLabel: 'On track' },
    { label: 'Overdue invoices', value: '42', sub: '12 due this week', icon: 'alarm', status: 'watch', statusLabel: 'Watch' },
    { label: 'Pending payments', value: '$9,250', sub: 'Bills to clear', icon: 'inbox', status: 'watch', statusLabel: 'Action' },
    { label: 'Period status', value: 'Term 1 · Open', sub: 'Close by Apr 05', icon: 'calendar', status: 'ready', statusLabel: 'Open' },
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

  icons = new Map<string, SafeHtml>();

  icon(name: string): SafeHtml | undefined {
    return this.icons.get(name) || this.icons.get('default');
  }

  private addIcon(name: string, paths: string[]) {
    const body = paths.map(p => `<path d="${p}" />`).join('');
    this.icons.set(
      name,
      this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
      )
    );
  }

  private registerIcons() {
    this.addIcon('journal', ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M7 9h10', 'M7 13h10', 'M7 17h6']);
    this.addIcon('accounts', ['M3 7h7l2 2h9v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z']);
    this.addIcon('fees', ['M4 5h12a2 2 0 0 1 2 2v12l-4-3-4 3V7a2 2 0 0 0-2-2H4z']);
    this.addIcon('assignment', ['M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3z']);
    this.addIcon('collection', ['M3 7h18v10H3z', 'M3 10h18']);
    this.addIcon('reports', ['M5 19V9', 'M11 19V5', 'M17 19v-8']);
    this.addIcon('expense', ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 7h6', 'M9 11h6']);
    this.addIcon('bill', ['M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 7l4.5 5h7L20 7']);
    this.addIcon('bank', ['M12 5l9 4H3z', 'M3 9h18', 'M5 9v8', 'M9 9v8', 'M13 9v8', 'M17 9v8', 'M3 17h18']);
    this.addIcon('payroll', ['M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z']);
    this.addIcon('trial', ['M6 4l6-2 6 2', 'M6 4l-3 5h6l-3-5z', 'M18 4l-3 5h6l-3-5z', 'M6 9v9a3 3 0 0 0 6 0V9', 'M12 9v9a3 3 0 0 0 6 0V9']);
    this.addIcon('period', ['M12 6a6 6 0 1 1-6 6 6 6 0 0 1 6-6zm0 2v4l3 1']);
    this.addIcon('alarm', ['M12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5zm0 0V4', 'M5 5 3 7', 'M19 5l2 2']);
    this.addIcon('inbox', ['M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 7l4 5h8l4-5']);
    this.addIcon('calendar', ['M7 3v3', 'M17 3v3', 'M4 8h16', 'M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z']);
    this.addIcon('briefcase', ['M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z']);
    this.addIcon('default', ['M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9z']);
  }
}
