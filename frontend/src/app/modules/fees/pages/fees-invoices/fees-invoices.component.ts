import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../../../core/services/fees.service';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Payment } from '../../../../core/models/fees.model';

@Component({
  selector: 'app-fees-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fees-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Invoices & Payments</h1>
          <p class="sub">Issue invoices, record payments, and monitor balances.</p>
        </div>
      </header>

      <section class="card issue-card">
        <div class="card-header">
          <div>
            <p class="eyebrow">Create Invoice</p>
            <h3>Issue a new invoice</h3>
          </div>
          <span class="pill ghost">Step 1 · Issue</span>
        </div>
        <form class="form-grid" (ngSubmit)="createInvoice()">
          <label>Student
            <select [(ngModel)]="newInvoice.studentId" name="studentId" (change)="onStudentChange()">
              <option value="" disabled>Select student</option>
              <option *ngFor="let s of students" [value]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </label>
          <label>Fee Plan
            <select [(ngModel)]="newInvoice.planId" name="planId" (change)="onPlanChange()">
              <option value="" disabled>Select plan</option>
              <option *ngFor="let p of fees.plans()" [value]="p.id">{{ p.name }} — {{ p.amount | currency:p.currency || 'USD' }}</option>
            </select>
          </label>
          <label>Due Date
            <input type="date" [(ngModel)]="newInvoice.dueDateString" name="dueDate" required />
          </label>
          <label>Amount
            <input type="number" min="0" step="0.01" [(ngModel)]="newInvoice.amount" name="amount" required />
          </label>
          <label>Reference
            <input [(ngModel)]="newInvoice.reference" name="reference" placeholder="INV-2024-001" />
          </label>
          <label>Notes
            <input [(ngModel)]="newInvoice.notes" name="notes" placeholder="Optional note" />
          </label>
          <div class="actions">
            <button class="btn primary" type="submit" [disabled]="!newInvoice.studentId || !newInvoice.planId">Create Invoice</button>
            <span class="muted">Auto-fills amount from plan; adjust if needed.</span>
          </div>
        </form>
      </section>

      <div class="table-controls">
        <div class="filters">
          <button class="chip" [class.active]="statusFilter === ''" (click)="setStatus('')">All</button>
          <button class="chip" [class.active]="statusFilter === 'issued'" (click)="setStatus('issued')">Issued</button>
          <button class="chip" [class.active]="statusFilter === 'overdue'" (click)="setStatus('overdue')">Overdue</button>
          <button class="chip" [class.active]="statusFilter === 'paid'" (click)="setStatus('paid')">Paid</button>
        </div>
        <span class="muted" *ngIf="fees.loading()">Loading…</span>
      </div>

      <div class="table">
        <div class="table-head">
          <span>Student</span>
          <span>Plan</span>
          <span>Due</span>
          <span>Amount</span>
          <span>Paid</span>
          <span>Balance</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        <div *ngFor="let inv of fees.invoices()" class="table-row">
          <span class="strong">{{ inv.studentName }}</span>
          <span>{{ inv.planName || inv.planId }}</span>
          <span>{{ inv.dueDate | date:'mediumDate' }}</span>
          <span>{{ inv.amount | currency:inv.currency || 'USD' }}</span>
          <span>{{ (inv.paidAmount || 0) | currency:inv.currency || 'USD' }}</span>
          <span [class.danger]="(inv.balance||0) > 0">{{ (inv.balance || (inv.amount - (inv.paidAmount||0))) | currency:inv.currency || 'USD' }}</span>
          <span><span class="pill"
              [class.paid]="inv.status === 'paid'"
              [class.overdue]="inv.status === 'overdue'">{{ inv.status | titlecase }}</span></span>
          <span class="actions-cell">
            <button class="btn-sm ghost" (click)="openPayment(inv)" [disabled]="inv.status === 'paid'">Record Payment</button>
            <button class="btn-sm ghost" (click)="openPayments(inv)">History</button>
          </span>
        </div>
      </div>

      <div class="modal-backdrop" *ngIf="paymentModal">
        <div class="modal">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="chip" type="button" (click)="closePayment()">✕</button>
          </div>
          <div class="muted">Invoice for {{ paymentModal?.studentName }} — Balance {{ paymentModal?.balance | currency:paymentModal?.currency || 'USD' }}</div>
          <form class="form-stack" (ngSubmit)="submitPayment()">
            <label>Amount
              <input type="number" min="0.01" step="0.01" [(ngModel)]="payment.amount" name="payAmount" required />
            </label>
            <label>Method
              <select [(ngModel)]="payment.method" name="payMethod">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Reference
              <input [(ngModel)]="payment.reference" name="payRef" placeholder="Txn / receipt ID" />
            </label>
            <div class="modal-actions">
              <button class="btn" type="button" (click)="closePayment()">Cancel</button>
              <button class="btn primary" type="submit">Save Payment</button>
            </div>
          </form>
        </div>
      </div>

      <div class="modal-backdrop" *ngIf="paymentsModal">
        <div class="modal">
          <div class="modal-header">
            <h3>Payment History</h3>
            <button class="chip" type="button" (click)="closePayments()">✕</button>
          </div>
          <div class="muted">Invoice {{ paymentsModal?.studentName }} — {{ paymentsModal?.amount | currency:paymentsModal?.currency || 'USD' }}</div>
          <div class="table small-table">
            <div class="table-head">
              <span>Date</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Ref</span>
            </div>
            <div class="table-row" *ngFor="let p of payments">
              <span>{{ p.paidAt | date:'medium' }}</span>
              <span>{{ p.amount | currency:p.currency || 'USD' }}</span>
              <span>{{ p.method | titlecase }}</span>
              <span>{{ p.reference || '—' }}</span>
            </div>
            <div class="table-row" *ngIf="!payments.length">
              <span class="muted" style="grid-column:1/5">No payments yet</span>
            </div>
          </div>
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
    .table-head, .table-row { display:grid; grid-template-columns: repeat(8, 1fr); gap:0.5rem; padding:0.9rem 1rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .pill.paid { background: rgba(var(--color-success-rgb,16,185,129),0.15); color: var(--color-success,#10b981); }
    .pill.overdue { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }
    .btn-sm { border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); border-radius:8px; padding:0.45rem 0.75rem; cursor:pointer; }
    .btn-sm:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-sm.ghost { background: transparent; border-color: var(--color-border); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); margin-bottom:1rem; }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .pill.ghost { background: rgba(255,255,255,0.08); border:1px solid var(--color-border); }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; margin-top:0.25rem; grid-column:1 / -1; }
    .muted { color: var(--color-text-secondary); }
    .table-controls { display:flex; justify-content:space-between; align-items:center; margin:0.5rem 0; }
    .filters { display:flex; gap:0.4rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:999px; background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .chip.active { border-color: var(--color-primary); box-shadow: 0 6px 12px rgba(var(--color-primary-rgb,122,184,255),0.2); }
    .actions-cell { display:flex; gap:0.4rem; }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .danger { color: var(--color-error,#ef4444); }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:30; }
    .modal { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; width:min(420px, 90vw); box-shadow: 0 20px 40px rgba(0,0,0,0.35); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; }
    .form-stack { display:flex; flex-direction:column; gap:0.6rem; margin-top:0.25rem; }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem; }
  `]
})
export class FeesInvoicesComponent implements OnInit {
  students: Student[] = [];
  statusFilter = '';
  newInvoice: any = {
    studentId: '',
    studentName: '',
    planId: '',
    dueDateString: '',
    amount: 0,
    reference: '',
    notes: ''
  };
  paymentModal: any = null;
  payment = { amount: 0, method: 'cash', reference: '' };
  paymentsModal: any = null;
  payments: Payment[] = [];

  constructor(public fees: FeesService, private studentService: StudentService, private http: HttpClient) {}

  ngOnInit(): void {
    this.studentService.getStudents({}).subscribe(studs => this.students = studs);
  }

  onStudentChange() {
    const st = this.students.find(s => s.id === this.newInvoice.studentId);
    this.newInvoice.studentName = st ? `${st.firstName} ${st.lastName}` : '';
  }

  onPlanChange() {
    const plan = this.fees.plans().find(p => p.id === this.newInvoice.planId);
    if (plan) this.newInvoice.amount = plan.amount;
  }

  createInvoice() {
    if (!this.newInvoice.studentId || !this.newInvoice.planId || !this.newInvoice.dueDateString) return;
    this.fees.addInvoice({
      studentId: this.newInvoice.studentId,
      studentName: this.newInvoice.studentName,
      planId: this.newInvoice.planId,
      planName: this.fees.plans().find(p => p.id === this.newInvoice.planId)?.name,
      dueDate: new Date(this.newInvoice.dueDateString),
      amount: Number(this.newInvoice.amount || 0),
      reference: this.newInvoice.reference,
      notes: this.newInvoice.notes
    });
    this.newInvoice = { studentId: '', studentName: '', planId: '', dueDateString: '', amount: 0, reference: '', notes: '' };
  }

  openPayment(inv: any) {
    this.paymentModal = inv;
    this.payment = { amount: Math.max(inv.balance || 0, 0), method: 'cash', reference: '' };
  }

  closePayment() { this.paymentModal = null; }

  submitPayment() {
    if (!this.paymentModal) return;
    this.fees.recordPayment(this.paymentModal.id, {
      amount: Number(this.payment.amount),
      method: this.payment.method as any,
      reference: this.payment.reference
    });
    this.closePayment();
  }

  openPayments(inv: any) {
    this.paymentsModal = inv;
    this.payments = [];
    this.http.get<any[]>(`${environment.apiUrl}/fees/invoices/${inv.id}/payments`).subscribe((res: any[]) => {
      this.payments = res.map((p: any) => ({
        ...p,
        paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
        id: p.id || p._id,
      }));
    });
  }

  closePayments() { this.paymentsModal = null; }

  setStatus(status: string) {
    this.statusFilter = status;
    this.fees.refreshInvoices(status ? { status } : undefined);
  }
}
