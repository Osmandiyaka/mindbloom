import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ReportItem {
  name: string;
  category: string;
  description: string;
  id: string;
}

@Component({
  selector: 'app-report-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Report Center</span>
      </nav>
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
            <h3 class="card-title">Catalog</h3>
            <input type="search" [(ngModel)]="search" placeholder="Search reports" />
          </div>
          <div class="report-list">
            <div class="item" *ngFor="let r of filteredReports" (click)="select(r)" [class.active]="r === selected">
              <div>
                <p class="strong">{{ r.name }}</p>
                <p class="muted">{{ r.category }}</p>
              </div>
              <p class="muted desc">{{ r.description }}</p>
              <button class="chip" type="button" (click)="toggleFavorite(r); $event.stopPropagation()">
                {{ isFavorite(r) ? '★' : '☆' }} Favorite
              </button>
            </div>
            <div class="muted" *ngIf="!filteredReports.length">No reports found.</div>
          </div>
        </div>

        <div class="card params" *ngIf="selected">
          <div class="card-header">
            <h3 class="card-title">{{ selected.name }}</h3>
            <span class="muted">{{ selected.category }}</span>
          </div>
          <div class="controls">
            <div class="chips">
              <button class="chip" [class.active]="preset === 'mtd'" (click)="applyPreset('mtd')">MTD</button>
              <button class="chip" [class.active]="preset === 'qtd'" (click)="applyPreset('qtd')">QTD</button>
              <button class="chip" [class.active]="preset === 'ytd'" (click)="applyPreset('ytd')">YTD</button>
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
              <label>Scope
                <select [(ngModel)]="params.scope" name="scope">
                  <option value="all">All campuses</option>
                  <option value="main">Main campus</option>
                  <option value="annex">Annex campus</option>
                </select>
              </label>
              <div class="actions">
                <button class="btn" type="button" (click)="resetParams()">Reset</button>
                <button class="btn primary" type="button" (click)="preview()">Generate</button>
              </div>
            </form>
            <div class="schedule">
              <div class="schedule-header">
                <p class="strong">Schedule (mock)</p>
                <label class="inline">
                  <input type="checkbox" [(ngModel)]="schedule.enabled" name="scheduleEnabled" /> Enable
                </label>
              </div>
              <div class="schedule-grid" [class.disabled]="!schedule.enabled">
                <label>Frequency
                  <select [(ngModel)]="schedule.frequency" name="frequency" [disabled]="!schedule.enabled">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label>Time
                  <input type="time" [(ngModel)]="schedule.time" name="time" [disabled]="!schedule.enabled" />
                </label>
                <label class="full">Recipients
                  <input type="text" [(ngModel)]="schedule.recipients" name="recipients" placeholder="comma-separated emails" [disabled]="!schedule.enabled" />
                </label>
              </div>
            </div>
          </div>
          <div class="preview">
            <p class="muted">Preview (mock):</p>
            <div class="preview-box">
              <p class="strong">{{ selected.name }}</p>
              <p class="muted">
                {{ params.start || 'Start' }} → {{ params.end || 'End' }} · {{ params.scope | titlecase }} · {{ params.format | uppercase }}
              </p>
              <div class="preview-table">
                <div class="row head"><span>Line</span><span>Amount</span></div>
                <div class="row" *ngFor="let row of previewRows">
                  <span>{{ row.label }}</span>
                  <span>{{ row.value }}</span>
                </div>
              </div>
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
    .card-header input { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface); color: var(--color-text-primary); }
    .report-list { display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; }
    .item { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface-hover); cursor:pointer; }
    .item.active { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
    .desc { margin:0.25rem 0 0; }
    .chip { border:1px solid var(--color-border); padding:0.25rem 0.6rem; border-radius:999px; background: var(--color-surface); color: var(--color-text-primary); cursor:pointer; }
    .controls { display:flex; flex-direction:column; gap:0.75rem; }
    .chips { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.8rem; border-radius:999px; background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .chip.active { border-color: var(--color-primary); color: var(--color-primary); }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; margin:0.5rem 0 1rem; align-items:end; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; gap:0.5rem; justify-content:flex-end; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .preview { margin-top:0.5rem; }
    .preview-box { border:1px dashed var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .preview-table { margin-top:0.5rem; border:1px solid var(--color-border); border-radius:8px; overflow:hidden; }
    .preview-table .row { display:grid; grid-template-columns: 1fr auto; padding:0.45rem 0.75rem; border-top:1px solid var(--color-border); }
    .preview-table .row.head { background: var(--color-surface); font-weight:700; }
    .preview-table .row:first-of-type { border-top:none; }
    .schedule { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface); display:flex; flex-direction:column; gap:0.5rem; }
    .schedule-header { display:flex; justify-content:space-between; align-items:center; }
    .schedule-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.6rem; }
    .schedule-grid.disabled { opacity:0.6; }
    .inline { display:flex; align-items:center; gap:0.4rem; color: var(--color-text-primary); }
    .strong { font-weight:700; color: var(--color-text-primary); margin:0; }
    .muted { color: var(--color-text-secondary); margin:0; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class ReportCenterComponent {
  reports: ReportItem[] = [
    { id: 'tb', name: 'Trial Balance', category: 'General Ledger', description: 'Debits and credits as of a date' },
    { id: 'pl', name: 'Income Statement', category: 'General Ledger', description: 'Revenue and expenses for a period' },
    { id: 'bs', name: 'Balance Sheet', category: 'General Ledger', description: 'Assets, liabilities, and equity snapshot' },
    { id: 'fees', name: 'Fee Collection Summary', category: 'Fees', description: 'Collections by class and mode' },
    { id: 'stmt', name: 'Student Statement', category: 'Fees', description: 'Individual student ledger' },
  ];
  search = '';
  selected: ReportItem | null = null;
  params = { start: '', end: '', format: 'html', scope: 'all' };
  preset: 'mtd' | 'qtd' | 'ytd' | '' = '';
  previewRows = [
    { label: 'Line 1', value: '$12,500.00' },
    { label: 'Line 2', value: '$8,320.00' },
    { label: 'Line 3', value: '$4,180.00' },
  ];
  favorites = new Set<string>();
  schedule = { enabled: false, frequency: 'weekly', time: '08:00', recipients: '' };

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

  resetParams() {
    this.params = { start: '', end: '', format: 'html', scope: 'all' };
    this.preset = '';
  }

  applyPreset(key: 'mtd' | 'qtd' | 'ytd') {
    this.preset = key;
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    if (key === 'mtd') {
      this.params.start = new Date(y, m, 1).toISOString().slice(0, 10);
    } else if (key === 'qtd') {
      const qStartMonth = Math.floor(m / 3) * 3;
      this.params.start = new Date(y, qStartMonth, 1).toISOString().slice(0, 10);
    } else if (key === 'ytd') {
      this.params.start = new Date(y, 0, 1).toISOString().slice(0, 10);
    }
    this.params.end = today.toISOString().slice(0, 10);
  }

  toggleFavorite(r: ReportItem) {
    if (this.isFavorite(r)) {
      this.favorites.delete(r.id);
    } else {
      this.favorites.add(r.id);
    }
  }

  isFavorite(r: ReportItem) {
    return this.favorites.has(r.id);
  }
}
