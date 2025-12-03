import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type RunStatus = 'ready' | 'pending' | 'processed';

interface EmployeeRow {
  name: string;
  position: string;
  grade: string;
  gross: number;
  net: number;
  status: RunStatus;
  selected?: boolean;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Payroll</span>
      </nav>
      <header class="page-header">
        <div>
          <h1>Payroll Dashboard</h1>
          <p class="sub">Monthly run summary, employees, and status (mock UI).</p>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" *ngIf="hasProcessed" (click)="downloadPayslips()">Download payslips</button>
          <select class="mini" [(ngModel)]="run.month">
            <option *ngFor="let m of months" [value]="m">{{ m }}</option>
          </select>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="run.locked" />
            <span>Lock period</span>
          </label>
          <button class="btn ghost" type="button">Import staff</button>
          <button class="btn primary" type="button">Process month</button>
        </div>
      </header>

      <section class="grid">
        <div class="card summary">
          <div class="card-header">
            <h3>Current Run</h3>
            <span class="pill">{{ run.status | titlecase }}</span>
          </div>
          <div class="summary-grid">
            <div>
              <p class="label">Month</p>
              <p class="value">{{ run.month }}</p>
            </div>
            <div>
              <p class="label">Employees</p>
              <p class="value">{{ run.count }}</p>
            </div>
            <div>
              <p class="label">Gross Total</p>
              <p class="value">{{ run.gross | currency:'USD' }}</p>
            </div>
            <div>
              <p class="label">Net Total</p>
              <p class="value">{{ run.net | currency:'USD' }}</p>
            </div>
          </div>
        </div>

        <div class="card filters">
          <div class="card-header">
            <h3>Filters</h3>
          </div>
          <div class="filter-row">
            <label>Search
              <input type="search" [(ngModel)]="search" placeholder="Search name or position" />
            </label>
            <label>Grade
              <select [(ngModel)]="gradeFilter">
                <option value="">All grades</option>
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
              </select>
            </label>
            <label>Status
              <select [(ngModel)]="statusFilter">
                <option value="">All</option>
                <option value="ready">Ready</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
              </select>
            </label>
            <div class="actions">
              <button class="btn ghost" type="button" (click)="reset()">Reset</button>
            </div>
          </div>
        </div>

      </section>

      <section class="card">
        <div class="toolbar">
          <div class="chip-row">
            <button class="chip" [class.active]="!statusFilter" (click)="statusFilter=''">All</button>
            <button class="chip" [class.active]="statusFilter==='ready'" (click)="statusFilter='ready'">Ready</button>
            <button class="chip" [class.active]="statusFilter==='pending'" (click)="statusFilter='pending'">Pending</button>
            <button class="chip" [class.active]="statusFilter==='processed'" (click)="statusFilter='processed'">Processed</button>
          </div>
          <div class="bulk-actions">
            <label class="toggle small">
              <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleAll()" />
              <span>Select All</span>
            </label>
            <button class="btn ghost small" type="button" (click)="markProcessed()">Mark as processed</button>
          </div>
        </div>
        <div class="table">
          <div class="table-head">
            <span></span><span>Name</span><span>Position</span><span>Grade</span><span>Gross</span><span>Net</span><span>Status</span><span></span>
          </div>
          <div class="table-row" *ngFor="let e of filtered">
            <span><input type="checkbox" [(ngModel)]="e.selected" /></span>
            <span class="strong">{{ e.name }}</span>
            <span>{{ e.position }}</span>
            <span>{{ e.grade }}</span>
            <span>{{ e.gross | currency:'USD' }}</span>
            <span>{{ e.net | currency:'USD' }}</span>
            <span><span class="pill" [class.ready]="e.status==='ready'" [class.pending]="e.status==='pending'" [class.processed]="e.status==='processed'">{{ e.status }}</span></span>
            <span><button class="btn ghost small" type="button" (click)="viewPayslip(e)">View</button></span>
          </div>
          <div class="table-row" *ngIf="!filtered.length">
            <span class="muted" style="grid-column:1/8">No employees for filters.</span>
          </div>
        </div>
        <div class="summary-bar" *ngIf="filtered.length">
          <span>Total Gross: <strong>{{ totalGross | currency:'USD' }}</strong></span>
          <span>Total Net: <strong>{{ totalNet | currency:'USD' }}</strong></span>
          <span>Ready: {{ statusCount('ready') }}</span>
          <span>Pending: {{ statusCount('pending') }}</span>
          <span>Processed: {{ statusCount('processed') }}</span>
          <span class="right" *ngIf="hasProcessed">
            <button class="btn ghost small" type="button" (click)="downloadPayslips()">Download payslips</button>
          </span>
        </div>
      </section>

      @if (selected) {
        <div class="modal-backdrop" (click)="closePayslip()"></div>
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Payslip Preview</h3>
              <p class="muted">{{ selected.name }} · {{ selected.position }}</p>
            </div>
            <button class="btn ghost small" type="button" (click)="closePayslip()">✕</button>
          </div>
          <div class="payslip-body">
            <div class="payslip-grid">
              <div>
                <p class="label">Gross</p>
                <p class="value">{{ selected.gross | currency:'USD' }}</p>
              </div>
              <div>
                <p class="label">Net</p>
                <p class="value">{{ selected.net | currency:'USD' }}</p>
              </div>
              <div>
                <p class="label">Status</p>
                <p class="value"><span class="pill" [class.ready]="selected.status==='ready'" [class.pending]="selected.status==='pending'" [class.processed]="selected.status==='processed'">{{ selected.status }}</span></p>
              </div>
            </div>
            <div class="breakdown">
              <div class="row head"><span>Component</span><span>Amount</span></div>
              <div class="row"><span>Basic</span><span>{{ breakdown.basic | currency:'USD' }}</span></div>
              <div class="row"><span>Allowances</span><span>{{ breakdown.allowances | currency:'USD' }}</span></div>
              <div class="row"><span>Deductions</span><span>{{ breakdown.deductions | currency:'USD' }}</span></div>
              <div class="row total"><span>Net</span><span>{{ selected.net | currency:'USD' }}</span></div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn primary" type="button" (click)="closePayslip()">Close</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    h1 { margin:0 0 0.2rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.6rem 1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; text-decoration:none; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .btn.small { padding:0.35rem 0.7rem; }
    .mini { padding:0.5rem 0.7rem; border-radius:8px; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .toggle { display:inline-flex; align-items:center; gap:0.35rem; color: var(--color-text-primary); font-weight:600; flex-direction:row; }
    .toggle input { margin:0; vertical-align:middle; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .card-header h3 { margin:0; color: var(--color-text-primary); }
    .summary-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:0.75rem; }
    @media (min-width: 900px) { .summary-grid { grid-template-columns: repeat(4, 1fr); } }
    .label { margin:0; color: var(--color-text-secondary); font-weight:600; font-size:0.9rem; }
    .value { margin:0.1rem 0 0; color: var(--color-text-primary); font-weight:700; font-size:1.1rem; }
    .filters .filter-row { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:0.6rem; align-items:end; }
    @media (min-width: 900px) { .filters .filter-row { grid-template-columns: repeat(4, 1fr); } }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 0.6fr 1.6fr 1.2fr 1fr 1fr 1fr 1fr 0.8fr; padding:0.7rem 0.85rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .pill { padding:0.2rem 0.6rem; border-radius:12px; border:1px solid var(--color-border); background: var(--color-surface); font-weight:600; text-transform:capitalize; }
    .pill.ready { border-color: var(--color-success,#10b981); color: var(--color-success,#10b981); }
    .pill.pending { border-color: var(--color-warning,#f59e0b); color: var(--color-warning,#f59e0b); }
    .pill.processed { border-color: var(--color-primary); color: var(--color-primary); }
    .toolbar { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; padding:0.5rem 0; }
    .chip-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:12px; background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; font-weight:600; }
    .chip.active { border-color: var(--color-primary); color: var(--color-primary); }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:20; }
    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width: min(620px, 94vw); background: var(--color-surface); border:1px solid var(--color-border); border-radius:14px; padding:1rem; box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.25)); z-index:21; display:flex; flex-direction:column; gap:0.75rem; }
    .modal-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .payslip-body { display:flex; flex-direction:column; gap:0.75rem; }
    .payslip-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:0.75rem; }
    .breakdown { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .breakdown .row { display:grid; grid-template-columns: 1fr auto; padding:0.55rem 0.75rem; border-top:1px solid var(--color-border); color: var(--color-text-primary); }
    .breakdown .row.head { background: var(--color-surface-hover); font-weight:700; }
    .breakdown .row:first-of-type { border-top:none; }
    .breakdown .row.total { font-weight:700; background: var(--color-surface-hover); }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
    .summary-bar { display:flex; gap:1rem; flex-wrap:wrap; padding:0.65rem 0.85rem; background: var(--color-surface-hover); border:1px solid var(--color-border); border-radius:10px; margin-top:0.6rem; color: var(--color-text-primary); align-items:center; }
    .summary-bar .right { margin-left:auto; }
  `]
})
export class PayrollComponent {
  search = '';
  gradeFilter = '';
  statusFilter = '';
  grades = ['A1', 'B1', 'C1', 'D1'];
  months = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'];

  run = {
    month: 'Feb 2025',
    count: 12,
    gross: 48200,
    net: 39600,
    status: 'ready' as RunStatus,
    locked: false
  };
  runHistory: { month: string; gross: number; net: number; status: RunStatus }[] = [
    { month: 'January 2025', gross: 48000, net: 39400, status: 'processed' },
    { month: 'December 2024', gross: 47800, net: 39200, status: 'processed' },
    { month: 'November 2024', gross: 47200, net: 38800, status: 'processed' },
  ];

  employees: EmployeeRow[] = [
    { name: 'Adaeze N.', position: 'Teacher', grade: 'B1', gross: 4200, net: 3600, status: 'ready' },
    { name: 'Michael K.', position: 'Administrator', grade: 'C1', gross: 3800, net: 3300, status: 'pending' },
    { name: 'Sara D.', position: 'Librarian', grade: 'C1', gross: 3200, net: 2800, status: 'processed' },
    { name: 'John L.', position: 'Driver', grade: 'D1', gross: 2800, net: 2400, status: 'ready' },
    { name: 'Chika O.', position: 'Accountant', grade: 'B1', gross: 4500, net: 3900, status: 'pending' },
  ];
  selected: EmployeeRow | null = null;
  breakdown = { basic: 0, allowances: 0, deductions: 0 };
  selectAll = false;

  get filtered() {
    return this.employees.filter(e => {
      const matchesSearch = !this.search || e.name.toLowerCase().includes(this.search.toLowerCase()) || e.position.toLowerCase().includes(this.search.toLowerCase());
      const matchesGrade = !this.gradeFilter || e.grade === this.gradeFilter;
      const matchesStatus = !this.statusFilter || e.status === this.statusFilter;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  }

  reset() {
    this.search = '';
    this.gradeFilter = '';
    this.statusFilter = '';
  }

  viewPayslip(e: EmployeeRow) {
    this.selected = e;
    const deductions = +(e.gross - e.net).toFixed(2);
    const allowances = +(e.gross * 0.2).toFixed(2);
    const basic = +(e.gross - allowances - deductions).toFixed(2);
    this.breakdown = { basic, allowances, deductions };
  }

  closePayslip() {
    this.selected = null;
  }

  get totalGross() {
    return this.filtered.reduce((s, e) => s + e.gross, 0);
  }

  get totalNet() {
    return this.filtered.reduce((s, e) => s + e.net, 0);
  }

  statusCount(status: 'ready' | 'pending' | 'processed') {
    return this.filtered.filter(e => e.status === status).length;
  }

  toggleAll() {
    const val = this.selectAll;
    this.employees = this.employees.map(e => this.filtered.includes(e) ? { ...e, selected: val } : e);
  }

  markProcessed() {
    const ids = this.filtered.filter(e => e.selected).map(e => e.name);
    if (!ids.length) return;
    this.employees = this.employees.map(e => ids.includes(e.name) ? { ...e, status: 'processed', selected: false } : e);
    this.selectAll = false;
  }

  get hasProcessed() {
    return this.employees.some(e => e.status === 'processed');
  }

  downloadPayslips() {
    console.log('Downloading payslips (mock)');
  }
}
