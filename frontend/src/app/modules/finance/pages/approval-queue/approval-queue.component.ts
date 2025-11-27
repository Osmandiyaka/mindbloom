import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FinanceService } from '../../../../core/services/finance.service';

@Component({
  selector: 'app-approval-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Controls</p>
          <h1>Approval Queue</h1>
          <p class="sub">Review purchase requests and expense claims requiring approval.</p>
        </div>
      </header>

      <div class="grid">
        <div class="card">
          <div class="card-header">
            <h3>Purchase Requests</h3>
          </div>
          <div class="empty" *ngIf="!finance.purchaseRequests().length">No requests pending</div>
          <div class="list" *ngFor="let pr of finance.purchaseRequests()">
            <div>
              <div class="strong">{{ pr.description }}</div>
              <div class="muted">Budget: {{ pr.budgetName || pr.budgetCode }} • Amount: {{ pr.amount | number:'1.0-0' }}</div>
              <div class="muted">Status: {{ pr.status }}</div>
            </div>
            <button class="primary" (click)="approvePurchase(pr._id)" [disabled]="pr.status!=='pending'">Approve</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Expense Claims</h3>
          </div>
          <div class="empty" *ngIf="!finance.expenses().length">No expenses awaiting review</div>
          <div class="list" *ngFor="let exp of finance.expenses()">
            <div>
              <div class="strong">{{ exp.purpose }}</div>
              <div class="muted">Budget: {{ exp.budgetName || 'General' }} • Amount: {{ exp.amount | number:'1.0-0' }}</div>
              <div class="muted">Status: {{ exp.status }}</div>
            </div>
            <button class="primary" (click)="approveExpense(exp._id)" [disabled]="exp.status==='approved'">Approve</button>
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
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.75rem; }
    .card-header { display:flex; justify-content:space-between; align-items:center; }
    .list { display:flex; justify-content:space-between; align-items:center; border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; gap:0.5rem; }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); font-size:0.95rem; }
    .primary { padding:0.45rem 0.9rem; border:none; border-radius:8px; background: var(--color-primary,#2563eb); color:white; cursor:pointer; font-weight:700; }
    .empty { color: var(--color-text-tertiary); border:1px dashed var(--color-border); padding:1rem; border-radius:10px; text-align:center; }
  `]
})
export class ApprovalQueueComponent implements OnInit {
  constructor(public finance: FinanceService) { }

  ngOnInit(): void {
    this.finance.loadPurchaseRequests('pending');
    this.finance.loadExpenses('submitted');
  }

  approvePurchase(id: string) {
    this.finance.approvePurchase(id, { approverName: 'Approver', approverId: 'demo' });
  }

  approveExpense(id: string) {
    this.finance.approveExpense(id, { approverName: 'Approver', approverId: 'demo' });
  }
}
