import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../../core/services/finance.service';
import { AccountingService } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-budget-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Finance</p>
          <h1>Budget Dashboard</h1>
          <p class="sub">Track budget utilization and link spending to the trial balance.</p>
        </div>
        <div class="filters">
          <label>New Budget
            <input placeholder="Name" [(ngModel)]="newBudget.name">
          </label>
          <label>Code
            <input placeholder="Code" [(ngModel)]="newBudget.code">
          </label>
          <label>Limit
            <input type="number" placeholder="0" [(ngModel)]="newBudget.limit">
          </label>
          <button class="primary" (click)="createBudget()">Create</button>
        </div>
      </header>

      <div class="card">
        <div class="table">
          <div class="table-head">
            <span>Budget</span><span>Limit</span><span>Spent</span><span>Available</span><span>Status</span>
          </div>
          <div class="table-row" *ngFor="let budget of finance.budgets()">
            <div>
              <div class="strong">{{ budget.name }}</div>
              <div class="muted">{{ budget.code }}</div>
              <div class="progress">
                <div class="fill" [style.width.%]="progress(budget)"></div>
              </div>
            </div>
            <span>{{ budget.limit | number:'1.0-0' }}</span>
            <span>{{ budget.spent | number:'1.0-0' }}</span>
            <span [class.positive]="(budget.available ?? budget.limit-budget.spent) > 0">{{ (budget.available ?? (budget.limit-budget.spent)) | number:'1.0-0' }}</span>
            <span class="badge" [class.success]="budget.status==='active'" [class.muted]="budget.status!=='active'">{{ budget.status }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Trial Balance Snapshot</h3>
          <button class="ghost" (click)="accounting.loadTrialBalance()">Refresh</button>
        </div>
        <div class="table compact">
          <div class="table-head">
            <span>Account</span><span>Debit</span><span>Credit</span><span>Balance</span>
          </div>
          <div class="table-row" *ngFor="let row of accounting.trialBalance().slice(0,6)">
            <span class="strong">{{ row.accountCode }}</span>
            <span>{{ row.debit | number:'1.0-0' }}</span>
            <span>{{ row.credit | number:'1.0-0' }}</span>
            <span [class.danger]="row.balance < 0">{{ row.balance | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .filters { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:0.5rem; align-items:end; }
    label { display:flex; flex-direction:column; gap:0.25rem; font-weight:600; color: var(--color-text-primary); }
    input { border:1px solid var(--color-border); border-radius:8px; padding:0.5rem 0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .primary { padding:0.6rem 1rem; border:none; border-radius:8px; background: var(--color-primary,#2563eb); color:white; cursor:pointer; font-weight:700; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 0.8fr; padding:0.75rem 0.9rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .table.compact .table-head, .table.compact .table-row { grid-template-columns: repeat(4,1fr); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-tertiary); font-size:0.9rem; }
    .badge { padding:0.2rem 0.5rem; border-radius:999px; background: var(--color-surface-hover); text-transform: capitalize; font-weight:700; text-align:center; }
    .success { background: #dcfce7; color:#166534; }
    .muted { color: var(--color-text-tertiary); }
    .positive { color:#166534; }
    .danger { color: var(--color-error,#ef4444); }
    .progress { margin-top:0.25rem; width:100%; height:6px; border-radius:6px; background: var(--color-surface-hover); overflow:hidden; }
    .fill { height:100%; background: var(--color-primary,#2563eb); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .ghost { background:transparent; border:1px solid var(--color-border); padding:0.45rem 0.8rem; border-radius:8px; cursor:pointer; }
  `]
})
export class BudgetDashboardComponent {
  newBudget = { name: '', code: '', limit: 0 };

  constructor(public finance: FinanceService, public accounting: AccountingService) {}

  createBudget() {
    if (!this.newBudget.name || !this.newBudget.code) return;
    this.finance.createBudget(this.newBudget);
    this.newBudget = { name: '', code: '', limit: 0 };
  }

  progress(budget: any) {
    const ratio = ((budget.spent || 0) / (budget.limit || 1)) * 100;
    return Math.min(100, Math.round(ratio));
  }
}
