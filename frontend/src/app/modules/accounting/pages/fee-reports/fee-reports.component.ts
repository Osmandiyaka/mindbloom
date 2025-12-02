import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface CollectionRow {
  className: string;
  billed: number;
  collected: number;
  balance: number;
  rate: number;
}

interface DefaulterRow {
  student: string;
  grade: string;
  due: number;
  days: number;
  contact: string;
}

interface PaymentModeRow {
  mode: string;
  amount: number;
  pct: number;
}

@Component({
  selector: 'app-fee-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Fee Reports</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Fee Reports Dashboard</h1>
          <p class="sub">Class collections, defaulters, and payment mode mix (mocked).</p>
        </div>
      </header>

      <section class="filters card">
        <div class="row">
          <label>Start Date
            <input type="date" [(ngModel)]="filters.start" />
          </label>
          <label>End Date
            <input type="date" [(ngModel)]="filters.end" />
          </label>
          <label>Grade
            <select [(ngModel)]="filters.grade">
              <option value="">All grades</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </label>
          <label>Status
            <select [(ngModel)]="filters.status">
              <option value="all">All</option>
              <option value="ontrack">On track</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <div class="actions">
            <button class="btn" type="button" (click)="preset('mtd')">MTD</button>
            <button class="btn" type="button" (click)="preset('qtd')">QTD</button>
            <button class="btn" type="button" (click)="preset('ytd')">YTD</button>
            <button class="btn ghost" type="button" (click)="reset()">Reset</button>
          </div>
        </div>
      </section>

      <section class="grid">
        <div class="card">
          <div class="card-header">
            <h3>Class-wise Collections</h3>
            <div class="header-actions">
              <button class="btn ghost" type="button" (click)="mockExport('pdf')">Export PDF</button>
              <button class="btn ghost" type="button" (click)="mockExport('xlsx')">Export Excel</button>
            </div>
          </div>
          <div class="table">
            <div class="table-head">
              <span>Class</span><span>Billed</span><span>Collected</span><span>Balance</span><span>Progress</span>
            </div>
            <div class="table-row" *ngFor="let row of filteredClasses">
              <span class="strong">{{ row.className }}</span>
              <span>{{ row.billed | currency:'USD' }}</span>
              <span>{{ row.collected | currency:'USD' }}</span>
              <span [class.danger]="row.balance > 0">{{ row.balance | currency:'USD' }}</span>
              <span>
                <div class="bar">
                  <div class="fill" [style.width.%]="row.rate"></div>
                </div>
                <small class="muted">{{ row.rate }}%</small>
              </span>
            </div>
            <div class="table-row" *ngIf="!filteredClasses.length">
              <span class="muted" style="grid-column:1/6">No data for filters.</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Defaulters</h3>
            <span class="muted">Top overdue</span>
            <div class="header-actions">
              <div class="chip-row">
                <button class="chip" [class.active]="filters.status==='overdue'" (click)="filters.status='overdue'">Overdue</button>
                <button class="chip" [class.active]="filters.status==='all'" (click)="filters.status='all'">All</button>
              </div>
              <button class="btn ghost" type="button" (click)="exportDefaulters()">Export</button>
            </div>
          </div>
          <div class="table">
            <div class="table-head">
              <span>Student</span><span>Grade</span><span>Due</span><span>Days</span><span>Contact</span>
            </div>
            <div class="table-row" *ngFor="let d of filteredDefaulters">
              <span class="strong">{{ d.student }}</span>
              <span>{{ d.grade }}</span>
              <span class="danger">{{ d.due | currency:'USD' }}</span>
              <span>{{ d.days }} days</span>
              <span>{{ d.contact }}</span>
            </div>
            <div class="table-row" *ngIf="!filteredDefaulters.length">
              <span class="muted" style="grid-column:1/6">No defaulters for filters.</span>
            </div>
          </div>
        </div>

        <div class="card modes">
          <div class="card-header">
            <h3>Payment Mode Analysis</h3>
            <span class="muted">Mix for period</span>
          </div>
          <div class="trend">
            <p class="muted">Collections trend (mock)</p>
            <div class="spark">
              <div class="spark-line" *ngFor="let p of trendPoints" [style.height.%]="p"></div>
            </div>
          </div>
          <div class="mode-list">
            <div class="mode" *ngFor="let m of modes">
              <div class="mode-head">
                <p class="strong">{{ m.mode }}</p>
                <p class="muted">{{ m.amount | currency:'USD' }}</p>
              </div>
              <div class="bar">
                <div class="fill" [style.width.%]="m.pct"></div>
              </div>
              <p class="muted">{{ m.pct }}%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .card-header h3 { margin:0; color: var(--color-text-primary); }
    .header-actions { display:flex; gap:0.5rem; }
    .chip-row { display:flex; gap:0.35rem; flex-wrap:wrap; }
    .filters .row { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; align-items:end; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap; }
    .btn { border-radius:10px; padding:0.55rem 0.9rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.ghost { background: transparent; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; padding:0.7rem 0.85rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .table-row:nth-child(even) { background: color-mix(in srgb, var(--color-surface-hover) 55%, var(--color-surface) 45%); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); margin:0; }
    .danger { color: var(--color-error,#ef4444); }
    .bar { width:100%; height:10px; background: var(--color-surface); border:1px solid var(--color-border); border-radius:999px; overflow:hidden; }
    .fill { height:100%; background: linear-gradient(135deg, var(--color-primary,#7ab8ff), var(--color-primary-light,#9fd0ff)); }
    .trend { margin-bottom:0.5rem; }
    .spark { display:flex; gap:4px; align-items:flex-end; height:48px; padding:6px; border:1px solid var(--color-border); border-radius:8px; background: var(--color-surface); }
    .spark-line { width:10px; border-radius:4px 4px 0 0; background: linear-gradient(135deg, var(--color-primary,#7ab8ff), var(--color-primary-light,#9fd0ff)); }
    .modes .mode-list { display:flex; flex-direction:column; gap:0.6rem; }
    .mode { border:1px solid var(--color-border); border-radius:10px; padding:0.7rem 0.8rem; background: var(--color-surface-hover); }
    .mode-head { display:flex; justify-content:space-between; align-items:center; }
    .mode-head .strong { margin:0; }
  `]
})
export class FeeReportsComponent {
  grades = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  filters = { start: '', end: '', grade: '', status: 'all' };

  classRows: CollectionRow[] = [
    { className: 'Grade 5', billed: 15000, collected: 12000, balance: 3000, rate: 80 },
    { className: 'Grade 6', billed: 18000, collected: 15000, balance: 3000, rate: 83 },
    { className: 'Grade 7', billed: 20000, collected: 14000, balance: 6000, rate: 70 },
    { className: 'Grade 8', billed: 17000, collected: 17000, balance: 0, rate: 100 },
  ];

  defaulters: DefaulterRow[] = [
    { student: 'Amaka Obi', grade: 'Grade 6', due: 480, days: 18, contact: 'amaka@school.com' },
    { student: 'Chidi Okeke', grade: 'Grade 5', due: 320, days: 12, contact: 'chidi@school.com' },
    { student: 'Sara Danjuma', grade: 'Grade 7', due: 900, days: 25, contact: 'sara@school.com' },
  ];

  modes: PaymentModeRow[] = [
    { mode: 'Cash', amount: 8200, pct: 32 },
    { mode: 'Bank Transfer', amount: 12800, pct: 50 },
    { mode: 'Mobile Money', amount: 4600, pct: 18 },
  ];
  trendPoints = [25, 60, 45, 80, 55, 70, 90];

  get filteredClasses() {
    return this.classRows.filter(r => !this.filters.grade || r.className === this.filters.grade);
  }

  get filteredDefaulters() {
    let rows = this.defaulters;
    if (this.filters.grade) {
      rows = rows.filter(d => d.grade === this.filters.grade);
    }
    if (this.filters.status === 'overdue') {
      rows = rows.filter(d => d.days > 0);
    }
    return rows;
  }

  preset(key: 'mtd' | 'qtd' | 'ytd') {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    if (key === 'mtd') {
      this.filters.start = new Date(y, m, 1).toISOString().slice(0, 10);
    } else if (key === 'qtd') {
      const startM = Math.floor(m / 3) * 3;
      this.filters.start = new Date(y, startM, 1).toISOString().slice(0, 10);
    } else {
      this.filters.start = new Date(y, 0, 1).toISOString().slice(0, 10);
    }
    this.filters.end = today.toISOString().slice(0, 10);
  }

  reset() {
    this.filters = { start: '', end: '', grade: '', status: 'all' };
  }

  mockExport(type: 'pdf' | 'xlsx') {
    // placeholder for export action
    console.log(`Exporting fee reports as ${type.toUpperCase()}`);
  }

  exportDefaulters() {
    console.log('Exporting defaulters (mock)');
  }
}
