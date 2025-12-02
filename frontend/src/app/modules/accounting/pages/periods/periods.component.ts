import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-periods',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Periods</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting</p>
          <h1>Fiscal Periods</h1>
          <p class="sub">Open/close periods to control postings.</p>
        </div>
      </header>

      <section class="card">
        <h3>Create / Update Period</h3>
        <form class="form-grid" (ngSubmit)="save()">
          <label>Name
            <input [(ngModel)]="form.name" name="name" required placeholder="FY24 Q1" />
          </label>
          <label>Start
            <input type="date" [(ngModel)]="form.start" name="start" required />
          </label>
          <label>End
            <input type="date" [(ngModel)]="form.end" name="end" required />
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Save Period</button>
            <span class="muted">Period locks posting if status is closed/locked.</span>
          </div>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>Periods</h3>
        </div>
        <div class="period-grid">
          <div class="period-card" *ngFor="let p of accounting.periods()">
            <div class="period-head">
              <div>
                <p class="eyebrow small">{{ p.start | date:'MMM d' }} - {{ p.end | date:'MMM d, y' }}</p>
                <h4>{{ p.name }}</h4>
              </div>
              <span class="pill" [class.locked]="p.status !== 'open'">{{ p.status | titlecase }}</span>
            </div>
            <p class="muted">Controls posting window for the term.</p>
            <div class="actions-cell">
              <button class="chip" *ngIf="p.status === 'open'" (click)="close(p)">Close</button>
              <button class="chip" *ngIf="p.status !== 'open'" (click)="reopen(p)">Re-open</button>
            </div>
          </div>
          <div class="empty" *ngIf="!accounting.periods().length">
            <p>No periods defined.</p>
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
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.75rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .period-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap:0.75rem; }
    .period-card { border:1px solid var(--color-border); border-radius:12px; padding:0.9rem; background: var(--color-surface-hover); box-shadow: var(--shadow-sm); }
    .period-head { display:flex; justify-content:space-between; align-items:center; }
    .period-head h4 { margin:0; color: var(--color-text-primary); }
    .eyebrow.small { font-size:0.75rem; }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface); }
    .pill.locked { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }
    .actions-cell { display:flex; gap:0.35rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:10px; background: var(--color-surface); cursor:pointer; }
    .muted { color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .empty { color: var(--color-text-secondary); padding:1rem 0; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class PeriodsComponent {
  form = { name: '', start: '', end: '' };

  constructor(public accounting: AccountingService) {}

  save() {
    if (!this.form.name || !this.form.start || !this.form.end) return;
    this.accounting.upsertPeriod({ ...this.form });
    this.form = { name: '', start: '', end: '' };
  }

  close(p: any) { this.accounting.closePeriod(p._id || p.id); }
  reopen(p: any) { this.accounting.reopenPeriod(p._id || p.id); }
}
