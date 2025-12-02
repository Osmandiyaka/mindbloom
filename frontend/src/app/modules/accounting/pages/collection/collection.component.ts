import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface StudentFee {
  student: string;
  grade: string;
  admissionNo: string;
  due: number;
  overdue: number;
  lastPayment: string;
}

@Component({
  selector: 'app-fee-collection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Fee Collection Point</h1>
          <p class="sub">Search students, view outstanding balances, and record payments.</p>
        </div>
        <div class="actions">
          <button class="btn primary">Record Payment</button>
        </div>
      </header>

      <section class="card filters">
        <input type="search" [(ngModel)]="search" placeholder="Search by name or admission #" />
        <select [(ngModel)]="gradeFilter">
          <option value="">All grades</option>
          <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
        </select>
        <button class="btn ghost" (click)="clear()">Reset</button>
      </section>

      <section class="card">
        <div class="table">
          <div class="table-head">
            <span>Student</span><span>Grade</span><span>Admission</span><span>Due</span><span>Overdue</span><span>Last Payment</span><span>Action</span>
          </div>
          <div class="table-row" *ngFor="let s of filtered">
            <span class="strong">{{ s.student }}</span>
            <span>{{ s.grade }}</span>
            <span>{{ s.admissionNo }}</span>
            <span>{{ s.due | currency:'USD' }}</span>
            <span [class.danger]="s.overdue > 0">{{ s.overdue | currency:'USD' }}</span>
            <span>{{ s.lastPayment }}</span>
            <span><button class="chip">Collect</button></span>
          </div>
          <div class="table-row" *ngIf="!filtered.length">
            <span class="muted" style="grid-column:1/7">No students found.</span>
          </div>
        </div>
      </section>
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
    .filters { display:flex; gap:0.75rem; align-items:center; }
    .filters input, .filters select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr; padding:0.65rem 0.8rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .muted { color: var(--color-text-secondary); }
    .danger { color: var(--color-error,#ef4444); }
  `]
})
export class CollectionComponent {
  search = '';
  gradeFilter = '';
  students: StudentFee[] = [
    { student: 'Amaka Obi', grade: 'Grade 6', admissionNo: 'ADM-1023', due: 820, overdue: 120, lastPayment: 'Jan 15, 2025' },
    { student: 'Chidi Okeke', grade: 'Grade 5', admissionNo: 'ADM-1011', due: 540, overdue: 0, lastPayment: 'Jan 20, 2025' },
    { student: 'Sara Danjuma', grade: 'Grade 7', admissionNo: 'ADM-1029', due: 1200, overdue: 300, lastPayment: 'Jan 05, 2025' }
  ];
  grades = ['Grade 5', 'Grade 6', 'Grade 7'];

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
}
