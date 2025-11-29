import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdmissionsService } from '../../../../core/services/admissions.service';
import { AdmissionApplication } from '../../../../core/models/admission.model';

@Component({
  selector: 'app-online-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Online</p>
          <h2>Online Applications</h2>
          <p class="muted">Filter, search, and review incoming online submissions.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="refresh()">Refresh</button>
          <a class="btn primary" routerLink="/apply/application/new">Create Application</a>
        </div>
      </header>

      <div *ngIf="admissions.error()" class="alert">{{ admissions.error() }}</div>

      <div class="filters">
        <div class="filter-group">
          <label>Status</label>
          <div class="chips">
            <button
              *ngFor="let status of statuses"
              class="chip"
              [class.active]="statusFilter() === status || (!statusFilter() && status === 'all')"
              (click)="setStatus(status === 'all' ? '' : status)">
              {{ status | titlecase }}
            </button>
          </div>
        </div>
        <div class="filter-group">
          <label>Grade</label>
          <select [(ngModel)]="gradeFilter">
            <option value="">All grades</option>
            <option *ngFor="let grade of grades()" [value]="grade">{{ grade }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="search" [(ngModel)]="search" placeholder="Search by name or email" />
        </div>
      </div>

      <div class="table" *ngIf="filtered().length; else empty">
        <div class="table-head">
          <div>Name</div>
          <div>Grade</div>
          <div>Status</div>
          <div>Submitted</div>
          <div class="actions-col">Actions</div>
        </div>
        <div class="table-row" *ngFor="let app of filtered()">
          <div>
            <div class="strong">{{ app.applicantName }}</div>
            <div class="muted small">{{ app.email }}</div>
          </div>
          <div>{{ app.gradeApplying }}</div>
          <div>
            <span class="pill" [class.enrolled]="app.status === 'enrolled'" [class.rejected]="app.status === 'rejected'">
              {{ app.status | titlecase }}
            </span>
          </div>
          <div>{{ app.submittedAt | date:'mediumDate' }}</div>
          <div class="row-actions">
            <a class="btn tiny ghost" [routerLink]="['/admissions/online/review', app.id]">Review</a>
            <button class="btn tiny" (click)="advance(app)">Advance</button>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty">
          <p class="muted">No applications match your filters. Adjust filters or refresh.</p>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page-shell { padding: 1rem 1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary); }
    h2 { margin: 0 0 0.35rem; }
    .muted { color: var(--color-text-secondary); margin: 0; }
    .muted.small { font-size: 0.85rem; }
    .actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .btn { border:1px solid var(--color-border); border-radius:10px; padding:0.55rem 0.9rem; font-weight:600; cursor:pointer; background:var(--color-surface); color:var(--color-text-primary); transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; }
    .btn.ghost { background: transparent; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border: none; box-shadow:0 8px 20px rgba(var(--color-primary-rgb,123,140,255),0.35); }
    .btn.tiny { padding:0.35rem 0.6rem; border-radius:8px; font-size:0.85rem; }

    .filters { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:0.9rem 1rem; }
    .filter-group { display:flex; flex-direction:column; gap:0.35rem; }
    .filter-group label { font-weight:600; color:var(--color-text-primary); }
    select, input[type="search"] { padding:0.55rem 0.65rem; border-radius:8px; border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-primary); }
    .chips { display:flex; gap:0.35rem; flex-wrap:wrap; }
    .chip { padding:0.4rem 0.75rem; border-radius:999px; border:1px solid var(--color-border); background:var(--color-surface); cursor:pointer; }
    .chip.active { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; }

    .table { border:1px solid var(--color-border); border-radius:12px; overflow:hidden; background:var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr; gap:0.5rem; padding:0.75rem 1rem; align-items:center; }
    .table-head { background: var(--color-surface-hover,#121a2b); font-weight:700; color:var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); }
    .table-row:hover { background: var(--color-surface-hover,#0f1728); }
    .actions-col { text-align:right; }
    .row-actions { display:flex; gap:0.4rem; justify-content:flex-end; }
    .strong { font-weight:700; color:var(--color-text-primary); }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); color:var(--color-text-secondary); font-size:0.85rem; }
    .pill.enrolled { background: rgba(var(--color-success-rgb,16,185,129),0.18); color: var(--color-success,#10b981); }
    .pill.rejected { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }

    .alert { padding:0.75rem 1rem; border-radius:10px; background: rgba(var(--color-error-rgb,239,68,68),0.1); border:1px solid rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
    .empty { border:1px dashed var(--color-border); border-radius:12px; padding:1rem; text-align:center; }
  `]
})
export class OnlineApplicationsComponent {
  gradeFilter = '';
  search = '';
  statusFilter = signal<string>('');
  statuses = ['all', 'review', 'enrolled', 'rejected'];
  grades = computed(() => Array.from(new Set(this.admissions.applications().map(a => a.gradeApplying))).sort());
  filtered = computed(() => this.applyFilters());

  constructor(public admissions: AdmissionsService) {}

  refresh() {
    this.admissions.refresh();
  }

  setStatus(val: string) {
    this.statusFilter.set(val);
  }

  private applyFilters(): AdmissionApplication[] {
    const term = this.search.toLowerCase().trim();
    const status = this.statusFilter();
    const grade = this.gradeFilter;
    const source = this.admissions.applications();

    return source.filter(app => {
      const matchesTerm = !term || app.applicantName.toLowerCase().includes(term) || app.email.toLowerCase().includes(term);
      const matchesStatus = !status || app.status === status;
      const matchesGrade = !grade || app.gradeApplying === grade;
      return matchesTerm && matchesStatus && matchesGrade;
    });
  }

  advance(app: AdmissionApplication) {
    const nextStatus = app.status === 'review' ? 'enrolled' : app.status === 'enrolled' ? 'rejected' : 'review';
    this.admissions.updateStatus(app.id, nextStatus, 'Advanced via online queue');
  }
}
