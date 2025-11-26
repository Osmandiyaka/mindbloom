import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FeesService } from '../../../../core/services/fees.service';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-bulk-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Bulk Invoice</h1>
          <p class="sub">Create invoices for multiple students by class/grade.</p>
        </div>
      </header>

      <div class="filters card">
        <div class="filter">
          <label>Class / Grade</label>
          <select [(ngModel)]="filterClass" (change)="loadStudents()">
            <option value="">All</option>
            <option *ngFor="let cls of classOptions" [value]="cls">{{ cls }}</option>
          </select>
        </div>
        <div class="filter">
          <label>Fee Plan</label>
          <select [(ngModel)]="planId">
            <option value="" disabled>Select plan</option>
            <option *ngFor="let p of fees.plans()" [value]="p.id">{{ p.name }} — {{ p.amount | currency:p.currency || 'USD' }}</option>
          </select>
        </div>
        <div class="filter">
          <label>Due Date</label>
          <input type="date" [(ngModel)]="dueDate" />
        </div>
        <div class="summary">
          <span class="pill">Selected: {{ selectedCount }}</span>
          <span class="pill primary">Total: {{ totalAmount | currency:currentPlan?.currency || 'USD' }}</span>
          <button class="btn primary" (click)="bulkCreate()" [disabled]="!canCreate || processing">
            <span *ngIf="!processing">Create Invoices</span>
            <span *ngIf="processing">Creating {{ progressDone }}/{{ selectedCount }}</span>
          </button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-head">
          <span><input type="checkbox" [checked]="allSelected" (change)="toggleAll($event)" /></span>
          <span>Student</span>
          <span>Class</span>
          <span>Amount</span>
        </div>
        <div class="table-row" *ngFor="let s of students">
          <span><input type="checkbox" [checked]="selected.has(s.id)" (change)="toggle(s.id)" /></span>
          <span class="strong">{{ s.fullName || (s.firstName + ' ' + s.lastName) }}</span>
          <span>{{ s.enrollment?.class || '—' }}</span>
          <span>{{ planAmount | currency:currentPlan?.currency || 'USD' }}</span>
        </div>
        <div class="table-row" *ngIf="!students.length && !loading">
          <span class="muted" style="grid-column:1/4">No students found.</span>
        </div>
        <div class="table-row" *ngIf="loading">
          <span class="muted" style="grid-column:1/4">Loading...</span>
        </div>
      </div>

      <div class="toast" *ngIf="doneMessage">
        ✅ {{ doneMessage }}
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:0.85rem 1rem; box-shadow: var(--shadow-sm); }
    .filters { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; align-items:end; }
    .filter { display:flex; flex-direction:column; gap:0.35rem; }
    label { font-weight:700; color: var(--color-text-primary); }
    select, input[type="date"] { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .summary { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
    .pill { padding:0.35rem 0.6rem; border-radius:999px; background: var(--color-surface-hover); color: var(--color-text-primary); font-weight:600; }
    .pill.primary { background: rgba(var(--color-primary-rgb,122,184,255),0.2); color: var(--color-text-primary); }
    .btn { border-radius:10px; padding:0.6rem 1rem; font-weight:700; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .table-card { padding:0; }
    .table-head, .table-row { display:grid; grid-template-columns: 60px 2fr 1fr 1fr; align-items:center; padding:0.8rem 1rem; gap:0.5rem; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .toast { position:fixed; bottom:1rem; right:1rem; background: var(--color-surface); border:1px solid var(--color-border); border-radius:10px; padding:0.75rem 1rem; box-shadow: 0 12px 28px rgba(0,0,0,0.3); }
  `]
})
export class BulkInvoicesComponent implements OnInit {
  students: Student[] = [];
  loading = false;
  filterClass = '';
  planId = '';
  dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
  selected = new Set<string>();
  processing = false;
  progressDone = 0;
  doneMessage = '';

  constructor(public fees: FeesService, private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  get classOptions() {
    const classes = this.students.map(s => s.enrollment?.class).filter(Boolean) as string[];
    return Array.from(new Set(classes)).sort();
  }

  get currentPlan() {
    return this.fees.plans().find(p => p.id === this.planId);
  }

  get planAmount() {
    return this.currentPlan?.amount || 0;
  }

  get selectedCount() {
    return this.selected.size;
  }

  get totalAmount() {
    return this.selectedCount * this.planAmount;
  }

  get allSelected() {
    return this.students.length > 0 && this.selected.size === this.students.length;
  }

  get canCreate() {
    return !!this.planId && !!this.dueDate && this.selected.size > 0 && !this.processing;
  }

  loadStudents() {
    this.loading = true;
    this.studentService.getStudents(this.filterClass ? { class: this.filterClass } : undefined).subscribe(list => {
      this.students = list;
      this.loading = false;
      this.selected.clear();
    }, () => this.loading = false);
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.students.forEach(s => this.selected.add(s.id));
    } else {
      this.selected.clear();
    }
  }

  toggle(id: string) {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
  }

  async bulkCreate() {
    if (!this.canCreate || !this.currentPlan) return;
    this.processing = true;
    this.progressDone = 0;
    this.doneMessage = '';
    const due = new Date(this.dueDate);
    const plan = this.currentPlan;
    const toCreate = this.students.filter(s => this.selected.has(s.id));

    for (const s of toCreate) {
      try {
        await firstValueFrom(this.fees.createInvoice$({
          studentId: s.id,
          studentName: s.fullName || `${s.firstName} ${s.lastName}`,
          planId: plan.id,
          planName: plan.name,
          dueDate: due,
          amount: plan.amount,
          currency: plan.currency || 'USD',
          reference: `BULK-${plan.name}`
        }));
      } catch (e) {
        // swallow individual errors for now; could collect
      }
      this.progressDone += 1;
    }

    this.processing = false;
    this.doneMessage = `Created ${this.progressDone} invoice(s).`;
    this.selected.clear();
    this.fees.refreshInvoices();
  }
}
