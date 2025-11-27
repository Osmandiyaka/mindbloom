import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../../core/services/finance.service';

@Component({
  selector: 'app-expense-capture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Expenses</p>
          <h1>Capture Expense</h1>
          <p class="sub">Submit a new expense claim and associate it with a budget.</p>
        </div>
      </header>

      <div class="card form">
        <label>Purpose
          <input [(ngModel)]="form.purpose" placeholder="e.g. Science lab supplies" />
        </label>
        <label>Budget Code
          <input [(ngModel)]="form.budgetCode" placeholder="Optional" />
        </label>
        <label>Amount
          <input type="number" [(ngModel)]="form.amount" />
        </label>
        <label>Claimant
          <input [(ngModel)]="form.claimantName" placeholder="Name" />
        </label>
        <button class="primary" (click)="submit()">Submit Claim</button>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Recent Claims</h3>
        </div>
        <div class="table">
          <div class="table-head">
            <span>Purpose</span><span>Budget</span><span>Amount</span><span>Status</span>
          </div>
          <div class="table-row" *ngFor="let claim of finance.expenses()">
            <span class="strong">{{ claim.purpose }}</span>
            <span>{{ claim.budgetCode || claim.budgetName || 'General' }}</span>
            <span>{{ claim.amount | number:'1.0-0' }}</span>
            <span class="badge" [class.success]="claim.status==='approved'">{{ claim.status }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .form { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.25rem; font-weight:600; color: var(--color-text-primary); }
    input { border:1px solid var(--color-border); border-radius:8px; padding:0.5rem 0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .primary { padding:0.6rem 1rem; border:none; border-radius:8px; background: var(--color-primary,#2563eb); color:white; cursor:pointer; font-weight:700; width:fit-content; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin-top:0.75rem; }
    .table-head, .table-row { display:grid; grid-template-columns: repeat(4,1fr); padding:0.75rem 0.9rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .badge { padding:0.2rem 0.5rem; border-radius:999px; background: var(--color-surface-hover); text-transform: capitalize; font-weight:700; text-align:center; }
    .success { background: #dcfce7; color:#166534; }
  `]
})
export class ExpenseCaptureComponent {
  form: any = { purpose: '', budgetCode: '', amount: 0, claimantName: '' };

  constructor(public finance: FinanceService) {
    this.finance.loadExpenses();
  }

  submit() {
    if (!this.form.purpose || !this.form.amount) return;
    this.finance.createExpense({
      purpose: this.form.purpose,
      amount: Number(this.form.amount),
      budgetCode: this.form.budgetCode,
      claimantName: this.form.claimantName,
    });
    this.form = { purpose: '', budgetCode: '', amount: 0, claimantName: '' };
  }
}
