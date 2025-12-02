import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentSelectorComponent, StudentOption } from '../../../../shared/components/student-selector/student-selector.component';
import { CurrencyDisplayComponent } from '../../../../shared/components/currency-display/currency-display.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';

interface StudentFee {
  student: string;
  grade: string;
  admissionNo: string;
  studentNo: string;
  due: number;
  overdue: number;
  lastPayment: string;
}

interface InvoiceMock {
  number: string;
  desc: string;
  balance: number;
  apply?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-fee-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentSelectorComponent, CurrencyDisplayComponent, AmountInputComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Fee Collection Point</h1>
          <p class="sub">Search students, view outstanding balances, and record payments.</p>
        </div>
      </header>

      <section class="card filters">
        <div class="card-header">
          <h3 class="card-title">Filter Roster</h3>
        </div>
        <div class="filter-fields">
          <input type="search" [(ngModel)]="search" placeholder="Search by name or admission #" />
          <select [(ngModel)]="gradeFilter">
            <option value="">All grades</option>
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
          <button class="btn ghost" (click)="clear()">Reset</button>
        </div>
      </section>

      <section class="card">
        <div class="table">
          <div class="table-head">
            <span>Student</span><span>Grade</span><span>Admission</span><span>Student #</span><span>Due</span><span>Overdue</span><span>Last Payment</span><span>Action</span>
          </div>
          <div class="table-row" *ngFor="let s of filtered">
            <div class="student-cell">
              <span class="avatar small">
                <span>{{ initials(s.student) }}</span>
              </span>
              <div>
                <span class="strong">{{ s.student }}</span>
              </div>
            </div>
            <span>{{ s.grade }}</span>
            <span>{{ s.admissionNo }}</span>
            <span>{{ s.studentNo }}</span>
            <span><app-currency [amount]="s.due"></app-currency></span>
            <span [class.danger]="s.overdue > 0"><app-currency [amount]="s.overdue"></app-currency></span>
            <span>{{ s.lastPayment }}</span>
            <span><button class="chip" (click)="openPayment(s)">Collect</button></span>
          </div>
          <div class="table-row" *ngIf="!filtered.length">
            <span class="muted" style="grid-column:1/8">No students found.</span>
          </div>
        </div>
      </section>

      @if (paymentOpen) {
        <div class="modal-backdrop" (click)="closePayment()"></div>
        <div class="payment-modal">
          <div class="payment-modal-header">
            <div>
              <h3 class="card-title">Record Payment</h3>
            </div>
            <button class="chip" (click)="closePayment()">✕</button>
          </div>
          <div class="banner success" *ngIf="savedBanner">
            Payment saved (mock)
          </div>
          <div class="payment-modal-body grid-body">
            <div class="col">
              <div class="payer">
                <div class="avatar-wrap">
                  <span class="avatar">
                    <span>{{ initials(activeStudent?.student || 'S') }}</span>
                  </span>
                </div>
                <div>
                  <p class="label">Student</p>
                  <p class="value">{{ activeStudent?.student || 'Select a student' }}</p>
                </div>
                <div>
                  <p class="label">Admission</p>
                  <p class="value">{{ activeStudent?.admissionNo || '—' }}</p>
                </div>
                <div>
                  <p class="label">Due</p>
                  <p class="value"><app-currency [amount]="activeStudent?.due || 0"></app-currency></p>
                </div>
                <div>
                  <p class="label">Overdue</p>
                  <p class="value danger"><app-currency [amount]="activeStudent?.overdue || 0"></app-currency></p>
                </div>
              </div>

              <div class="allocations" *ngIf="activeStudent">
                <div class="alloc-header">
                  <p class="section-title">Allocate to invoices</p>
                  <div class="alloc-actions">
                    <button class="chip" type="button" (click)="autoAllocate()">Auto-allocate oldest</button>
                    <button class="chip ghost" type="button" (click)="clearAllocations()">Clear</button>
                  </div>
                </div>
                <div class="alloc-table">
                  <div class="alloc-head">
                    <span>Invoice</span><span>Due</span><span>Apply</span><span>Select</span>
                  </div>
                  <div class="alloc-row" *ngFor="let inv of invoices">
                    <span>{{ inv.number }} · {{ inv.desc }}</span>
                    <span><app-currency [amount]="inv.balance"></app-currency></span>
                    <span>
                      <input
                        type="number"
                        min="0"
                        [max]="inv.balance"
                        [(ngModel)]="inv.apply"
                        (ngModelChange)="onApplyChange()"
                        [disabled]="!inv.selected"
                      />
                      <small class="inline-error" *ngIf="inv.apply && inv.apply > inv.balance">Cannot exceed due</small>
                    </span>
                    <span>
                      <input type="checkbox" [(ngModel)]="inv.selected" (ngModelChange)="onApplyChange()" />
                    </span>
                  </div>
                </div>
                <div class="alloc-summary">
                  <div class="alloc-metrics">
                    <span>Apply total: <app-currency [amount]="applyTotal" [strong]="true"></app-currency></span>
                    <span [class.danger]="remaining < 0">Remaining: <app-currency [amount]="remaining" [strong]="true"></app-currency></span>
                  </div>
                </div>
              </div>

              <div class="form-history">
                <form class="form-grid compact tight-row" (ngSubmit)="savePayment()">
                  <label>Amount
                    <app-amount-input [(ngModel)]="payment.amount" name="amount" required></app-amount-input>
                  </label>
                  <label>Mode
                    <select [(ngModel)]="payment.mode" name="mode" required>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </label>
                  <label>Date
                    <input type="date" [(ngModel)]="payment.date" name="date" required />
                  </label>
                  <label>Reference
                    <input [(ngModel)]="payment.reference" name="reference" placeholder="RCPT-001" />
                  </label>
                  <label class="full">Notes
                    <textarea rows="3" [(ngModel)]="payment.notes" name="notes" placeholder="Optional note"></textarea>
                  </label>
                  <div class="actions full">
                    <button class="btn primary" type="submit" [disabled]="remaining < 0">
                      <span class="icon">💾</span>
                      Save
                    </button>
                    <button class="btn ghost" type="button" (click)="closePayment()">Cancel</button>
                  </div>
                </form>

                <div class="history" *ngIf="activeStudentHistory.length; else noHistory">
                  <div class="history-head">
                    <span>Recent Payments</span>
                  </div>
                  <div class="history-row" *ngFor="let h of activeStudentHistory">
                    <span>{{ h.date }}</span>
                    <span>{{ h.mode }}</span>
                    <span><app-currency [amount]="h.amount"></app-currency></span>
                  </div>
                </div>
                <ng-template #noHistory>
                  <div class="history muted-state">
                    <div class="history-head">
                      <span>Recent Payments</span>
                    </div>
                    <div class="history-row">
                      <span class="muted">No payments yet</span>
                    </div>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .top-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .filters { display:flex; flex-direction:column; gap:0.75rem; }
    .filter-fields { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .filters input, .filters select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .selector-full { width:100%; display:block; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr; padding:0.65rem 0.8rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .muted { color: var(--color-text-secondary); }
    .danger { color: var(--color-error,#ef4444); }
    .student-cell { display:flex; gap:0.5rem; align-items:center; }
    .avatar.small { width:32px; height:32px; border-radius:10px; background: var(--color-surface-hover); display:flex; align-items:center; justify-content:center; font-weight:700; color: var(--color-text-primary); }
    .card-title { color: var(--color-text-primary); margin:0; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10; }
    .payment-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background: var(--color-surface); border:1px solid var(--color-border); border-radius:16px; padding:1.25rem; width: min(1100px, 95vw); max-height:88vh; z-index:1100; box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.25)); display:flex; flex-direction:column; }
    .payment-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; color: var(--color-text-primary); }
    .payment-modal-body { color: var(--color-text-primary); display:grid; grid-template-columns: 1fr; gap:1.25rem; align-items:start; overflow:auto; padding-right:0.5rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:0.65rem; }
    .form-grid.compact { grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); }
    .form-grid.tight-row { grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); }
    .form-grid input, .form-grid select, .form-grid textarea { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface); color: var(--color-text-primary); }
    .form-grid .full { grid-column:1/-1; }
    .payer { display:grid; grid-template-columns: 80px repeat(auto-fit,minmax(140px,1fr)); gap:0.5rem; background: var(--color-surface-hover); border:1px solid var(--color-border); border-radius:10px; padding:0.65rem 0.8rem; align-items:center; }
    .avatar-wrap { display:flex; justify-content:center; }
    .avatar { width:64px; height:64px; border-radius:14px; background: var(--color-surface); display:flex; align-items:center; justify-content:center; font-weight:700; color: var(--color-text-primary); background-size:cover; background-position:center; box-shadow: var(--shadow-sm); }
    .payer .label { margin:0; font-size:0.8rem; color: var(--color-text-secondary); text-transform:uppercase; letter-spacing:0.04em; }
    .payer .value { margin:0.15rem 0 0; font-weight:700; color: var(--color-text-primary); }
    .allocations { display:flex; flex-direction:column; gap:0.45rem; margin-top:0.4rem; }
    .alloc-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; }
    .section-title { margin:0; font-weight:700; color: var(--color-text-primary); }
    .alloc-table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); max-height:320px; overflow-y:auto; }
    .alloc-head, .alloc-row { display:grid; grid-template-columns: 2fr 1fr 1fr 0.8fr; gap:0.4rem; padding:0.5rem 0.7rem; align-items:center; }
    .alloc-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .alloc-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .alloc-row input[type="number"] { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.35rem; background: var(--color-surface); color: var(--color-text-primary); }
    .inline-error { display:block; color: var(--color-error,#ef4444); font-size:0.75rem; margin-top:0.2rem; }
    .alloc-summary { display:flex; flex-direction:column; gap:0.5rem; font-weight:700; color: var(--color-text-primary); }
    .alloc-actions { display:flex; justify-content:flex-end; }
    .alloc-metrics { display:flex; gap:1rem; justify-content:flex-end; flex-wrap:wrap; align-items:center; }
    .form-history { display:grid; grid-template-columns: 1fr 0.9fr; gap:1rem; align-items:start; }
    @media (max-width: 1024px) { .form-history { grid-template-columns: 1fr; } }
    .history { margin-top:0.25rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-surface); overflow:hidden; }
    .history-head { padding:0.6rem 0.8rem; font-weight:700; color: var(--color-text-primary); border-bottom:1px solid var(--color-border); }
    .history-row { display:grid; grid-template-columns: 1.2fr 1fr 1fr; padding:0.5rem 0.8rem; gap:0.5rem; color: var(--color-text-secondary); }
    .history-row:nth-child(odd) { background: var(--color-surface-hover); }
    .banner.success { background: color-mix(in srgb, var(--color-success,#16a34a) 18%, transparent); border:1px solid color-mix(in srgb, var(--color-success,#16a34a) 40%, transparent); color: var(--color-text-primary); padding:0.5rem 0.75rem; border-radius:10px; margin-bottom:0.5rem; }
  `]
})
export class CollectionComponent {
  search = '';
  gradeFilter = '';
  students: StudentFee[] = [
    { student: 'Amaka Obi', grade: 'Grade 6', admissionNo: 'ADM-1023', studentNo: 'STU-2001', due: 820, overdue: 120, lastPayment: 'Jan 15, 2025' },
    { student: 'Chidi Okeke', grade: 'Grade 5', admissionNo: 'ADM-1011', studentNo: 'STU-2002', due: 540, overdue: 0, lastPayment: 'Jan 20, 2025' },
    { student: 'Sara Danjuma', grade: 'Grade 7', admissionNo: 'ADM-1029', studentNo: 'STU-2003', due: 1200, overdue: 300, lastPayment: 'Jan 05, 2025' }
  ];
  grades = ['Grade 5', 'Grade 6', 'Grade 7'];
  studentOptions: StudentOption[] = [
    { id: 's1', name: 'Amaka Obi', className: 'Grade 6', admissionNo: 'ADM-1023' },
    { id: 's2', name: 'Chidi Okeke', className: 'Grade 5', admissionNo: 'ADM-1011' },
    { id: 's3', name: 'Sara Danjuma', className: 'Grade 7', admissionNo: 'ADM-1029' },
  ];
  selectedId: string | null = null;
  paymentOpen = false;
  activeStudent: StudentFee | null = null;
  payment = { amount: null as number | null, mode: 'cash', date: new Date().toISOString().slice(0,10), reference: '', notes: '' };
  paymentHistory: Record<string, { date: string; mode: string; amount: number }[]> = {
    'ADM-1023': [{ date: 'Jan 15, 2025', mode: 'Cash', amount: 200 }],
    'ADM-1011': [{ date: 'Jan 20, 2025', mode: 'Bank', amount: 300 }],
    'ADM-1029': [{ date: 'Jan 05, 2025', mode: 'Cash', amount: 500 }],
  };
  savedBanner = false;
  invoices: InvoiceMock[] = [
    { number: 'INV-1001', desc: 'Term 1 Tuition', balance: 500 },
    { number: 'INV-1002', desc: 'Transport', balance: 180 },
    { number: 'INV-1003', desc: 'Meals', balance: 140 }
  ];

  get filtered() {
    return this.students.filter(s => {
      const matchSearch = !this.search || s.student.toLowerCase().includes(this.search.toLowerCase()) || s.admissionNo.toLowerCase().includes(this.search.toLowerCase());
      const matchGrade = !this.gradeFilter || s.grade === this.gradeFilter;
      return matchSearch && matchGrade;
    });
  }

  clear() {
    this.search = '';
    this.gradeFilter = '';
  }

  openPayment(student?: StudentFee) {
    this.activeStudent = student || this.students.find(s => s.admissionNo === this.selectedStudent?.admissionNo) || null;
    this.paymentOpen = true;
  }

  closePayment() {
    this.paymentOpen = false;
  }

  savePayment() {
    // Mock save + reset allocations/payment
    this.invoices = this.invoices.map(inv => ({ ...inv, apply: undefined, selected: false }));
    if (this.activeStudent && this.payment.amount) {
      const arr = this.paymentHistory[this.activeStudent.admissionNo] || [];
      this.paymentHistory[this.activeStudent.admissionNo] = [
        { date: new Date().toLocaleDateString(), mode: this.payment.mode, amount: this.payment.amount },
        ...arr
      ].slice(0, 5);
    }
    this.savedBanner = true;
    setTimeout(() => this.savedBanner = false, 2500);
    this.payment = { amount: null, mode: 'cash', date: new Date().toISOString().slice(0,10), reference: '', notes: '' };
    this.paymentOpen = false;
  }

  get applyTotal(): number {
    return this.invoices.reduce((sum, inv) => sum + (inv.selected ? Number(inv.apply || 0) : 0), 0);
  }

  get remaining(): number {
    return Math.max(0, (this.payment.amount || 0) - this.applyTotal);
  }

  get selectedStudent(): StudentFee | null {
    if (!this.selectedId) return null;
    const opt = this.studentOptions.find(s => s.id === this.selectedId);
    if (!opt) return null;
    return this.students.find(s => s.admissionNo === opt.admissionNo) || null;
  }

  get activeStudentHistory() {
    if (!this.activeStudent) return [];
    return this.paymentHistory[this.activeStudent.admissionNo] || [];
  }

  onStudentSelected(sel: StudentOption | null) {
    this.selectedId = sel?.id || null;
  }

  autoAllocate() {
    let remaining = (this.payment.amount || 0);
    this.invoices = this.invoices.map(inv => {
      if (remaining <= 0) return { ...inv, apply: 0, selected: false };
      const apply = Math.min(remaining, inv.balance);
      remaining -= apply;
      return { ...inv, apply, selected: apply > 0 };
    });
    this.payment.amount = this.applyTotal;
  }

  clearAllocations() {
    this.invoices = this.invoices.map(inv => ({ ...inv, apply: undefined, selected: false }));
    this.payment.amount = null;
  }

  onApplyChange() {
    this.invoices = this.invoices.map(inv => {
      const applyVal = Number(inv.apply || 0);
      const capped = Math.min(applyVal, inv.balance);
      const selected = capped > 0 ? true : !!inv.selected;
      return { ...inv, apply: capped, selected };
    });
    this.payment.amount = this.applyTotal;
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }
}
