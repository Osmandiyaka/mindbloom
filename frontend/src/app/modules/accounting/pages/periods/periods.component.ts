import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-periods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
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
        <div class="table">
          <div class="table-head">
            <span>Name</span><span>Start</span><span>End</span><span>Status</span><span>Action</span>
          </div>
          <div class="table-row" *ngFor="let p of accounting.periods()">
            <span class="strong">{{ p.name }}</span>
            <span>{{ p.start | date:'mediumDate' }}</span>
            <span>{{ p.end | date:'mediumDate' }}</span>
            <span><span class="pill" [class.locked]="p.status !== 'open'">{{ p.status | titlecase }}</span></span>
            <span class="actions-cell">
              <button class="chip" *ngIf="p.status === 'open'" (click)="close(p)">Close</button>
              <button class="chip" *ngIf="p.status !== 'open'" (click)="reopen(p)">Re-open</button>
            </span>
          </div>
          <div class="table-row" *ngIf="!accounting.periods().length">
            <span class="muted" style="grid-column:1/5">No periods defined.</span>
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
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin-top:0.25rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr; gap:0.5rem; padding:0.75rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); }
    .pill.locked { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }
    .actions-cell { display:flex; gap:0.35rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .muted { color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
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
