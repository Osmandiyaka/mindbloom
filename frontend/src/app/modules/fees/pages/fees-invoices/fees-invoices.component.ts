import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeesService } from '../../../../core/services/fees.service';

@Component({
  selector: 'app-fees-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fees-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Invoices & Payments</h1>
          <p class="sub">Track issued invoices and record payments.</p>
        </div>
      </header>

      <div class="table">
        <div class="table-head">
          <span>Invoice</span>
          <span>Student</span>
          <span>Plan</span>
          <span>Due</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        <div *ngFor="let inv of fees.invoices()" class="table-row">
          <span>{{ inv.id }}</span>
          <span>{{ inv.studentName }}</span>
          <span>{{ inv.planId }}</span>
          <span>{{ inv.dueDate | date:'mediumDate' }}</span>
          <span>\${{ inv.amount }}</span>
          <span><span class="pill" [class.paid]="inv.status === 'paid'" [class.overdue]="inv.status === 'overdue'">{{ inv.status | titlecase }}</span></span>
          <span>
            <button class="btn-sm" [disabled]="inv.status === 'paid'" (click)="pay(inv.id)">Mark Paid</button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fees-page { padding: 1.5rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0; color: var(--color-text-primary); }
    .sub { margin:0.35rem 0 0; color: var(--color-text-secondary); }
    .table { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; overflow:hidden; box-shadow: var(--shadow-md); }
    .table-head, .table-row { display:grid; grid-template-columns: repeat(7, 1fr); gap:0.5rem; padding:0.9rem 1rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .pill.paid { background: rgba(var(--color-success-rgb,16,185,129),0.15); color: var(--color-success,#10b981); }
    .pill.overdue { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }
    .btn-sm { border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); border-radius:8px; padding:0.45rem 0.75rem; cursor:pointer; }
    .btn-sm:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class FeesInvoicesComponent {
  constructor(public fees: FeesService) {}

  pay(id: string) {
    this.fees.recordPayment(id);
  }
}
