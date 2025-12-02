import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ReportItem {
  name: string;
  category: string;
  description: string;
}

@Component({
  selector: 'app-report-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Reports</p>
          <h1>Report Center</h1>
          <p class="sub">Select a report, set parameters, and preview.</p>
        </div>
      </header>

      <section class="grid">
        <div class="card list">
          <div class="card-header">
            <h3>Catalog</h3>
            <input type="search" [(ngModel)]="search" placeholder="Search reports" />
          </div>
          <div class="report-list">
            <div class="item" *ngFor="let r of filteredReports" (click)="select(r)" [class.active]="r === selected">
              <div>
                <p class="strong">{{ r.name }}</p>
                <p class="muted">{{ r.category }}</p>
              </div>
              <p class="muted desc">{{ r.description }}</p>
            </div>
            <div class="muted" *ngIf="!filteredReports.length">No reports found.</div>
          </div>
        </div>

        <div class="card params" *ngIf="selected">
          <div class="card-header">
            <h3>{{ selected.name }}</h3>
            <span class="muted">{{ selected.category }}</span>
          </div>
          <form class="form-grid">
            <label>Start Date
              <input type="date" [(ngModel)]="params.start" name="start" />
            </label>
            <label>End Date
              <input type="date" [(ngModel)]="params.end" name="end" />
            </label>
            <label>Format
              <select [(ngModel)]="params.format" name="format">
                <option value="html">Preview</option>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
              </select>
            </label>
            <button class="btn primary" type="button" (click)="preview()">Preview</button>
          </form>
          <div class="preview">
            <p class="muted">Preview (mock):</p>
            <div class="preview-box">
              <p>{{ selected.name }} — {{ params.start || 'Start' }} to {{ params.end || 'End' }} ({{ params.format | uppercase }})</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; gap:0.75rem; color: var(--color-text-primary); }
    .card-header input { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .report-list { display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; }
    .item { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface-hover); cursor:pointer; }
    .item.active { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
    .desc { margin:0.25rem 0 0; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; margin:0.5rem 0 1rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .preview { margin-top:0.5rem; }
    .preview-box { border:1px dashed var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .strong { font-weight:700; color: var(--color-text-primary); margin:0; }
    .muted { color: var(--color-text-secondary); margin:0; }
  `]
})
export class ReportCenterComponent {
  reports: ReportItem[] = [
    { name: 'Trial Balance', category: 'General Ledger', description: 'Debits and credits as of a date' },
    { name: 'Income Statement', category: 'General Ledger', description: 'Revenue and expenses for a period' },
    { name: 'Balance Sheet', category: 'General Ledger', description: 'Assets, liabilities, and equity snapshot' },
    { name: 'Fee Collection Summary', category: 'Fees', description: 'Collections by class and mode' },
    { name: 'Student Statement', category: 'Fees', description: 'Individual student ledger' },
  ];
  search = '';
  selected: ReportItem | null = null;
  params = { start: '', end: '', format: 'html' };

  get filteredReports() {
    const term = this.search.toLowerCase();
    return this.reports.filter(r => !term || r.name.toLowerCase().includes(term) || r.category.toLowerCase().includes(term));
  }

  select(r: ReportItem) {
    this.selected = r;
  }

  preview() {
    // mock only
  }
}
