import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdmissionsService } from '../../../../core/services/admissions.service';
import { AdmissionApplication, ApplicationStatus } from '../../../../core/models/admission.model';
import { FeesService } from '../../../../core/services/fees.service';

@Component({
  selector: 'app-admissions-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admissions-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions</p>
          <h1>Applications Pipeline</h1>
          <p class="sub">Track inquiries through decision and enrollment.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="refresh()">Refresh</button>
          <a routerLink="/apply/application/new" class="btn btn-primary">New Application</a>
        </div>
      </header>

      <div *ngIf="admissions.error()" class="alert">{{ admissions.error() }}</div>
      <div *ngIf="admissions.loading()" class="banner info">Loading latest pipeline…</div>

      <section class="info-banner">
        <div>
          <h3>How enrollment works</h3>
          <p class="muted">
            Clicking <strong>Enroll</strong> will create a student record stub, pick your default fee plan ({{ defaultPlanName || 'no plan configured' }}),
            and generate an invoice due in 7 days. Recent invoices are listed on the right.
          </p>
        </div>
      </section>

      <div class="pipeline" *ngIf="stages().length > 0; else emptyState">
        <div *ngFor="let stage of stages()" class="stage">
          <div class="stage-header">
            <span class="stage-name">{{ stage.label }}</span>
            <span class="stage-count">{{ stage.apps.length }}</span>
          </div>
          <div class="stage-list">
            <div *ngFor="let app of stage.apps" class="card app-card">
              <div class="app-top">
                <div>
                  <h3>{{ app.applicantName }}</h3>
                  <p class="muted">{{ app.gradeApplying }}</p>
                </div>
                <span class="pill">{{ app.status | titlecase }}</span>
              </div>
              <p class="muted">{{ app.email }}</p>
              <div class="app-actions">
                <button class="btn-sm ghost" [disabled]="admissions.isBusy(app.id)" (click)="updateStatus(app, 'review')">
                  {{ admissions.isBusy(app.id) ? 'Updating…' : 'Review' }}
                </button>
                <button class="btn-sm danger" [disabled]="admissions.isBusy(app.id)" (click)="updateStatus(app, 'rejected')">
                  {{ admissions.isBusy(app.id) ? 'Updating…' : 'Reject' }}
                </button>
                <button class="btn-sm" [disabled]="admissions.isBusy(app.id)" (click)="enroll(app)">
                  {{ admissions.isBusy(app.id) ? 'Enrolling…' : 'Enroll' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty">
          <p class="muted">No applications yet. Start by creating a new application.</p>
        </div>
      </ng-template>

      <section class="aside">
        <div class="card mini-panel">
          <h3>Recent Invoices</h3>
          <div class="invoice" *ngFor="let inv of recentInvoices">
            <div>
              <div class="muted">{{ inv.id || inv._id }} · {{ inv.studentName }}</div>
              <div class="pill" [class.paid]="inv.status === 'paid'" [class.overdue]="inv.status === 'overdue'">{{ inv.status | titlecase }}</div>
            </div>
            <div class="amount">\${{ inv.amount }}</div>
            <button class="btn-sm" [disabled]="inv.status === 'paid'" (click)="pay(inv)">Mark Paid</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .admissions-page { padding: 1.5rem; display:grid; grid-template-columns: 2fr 1fr; gap:1rem; align-items:start; }
    .page-header { grid-column:1 / -1; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight: 700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .info-banner { grid-column:1 / -1; background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem 1.25rem; box-shadow: var(--shadow-sm); margin-bottom:0.75rem; }
    .info-banner h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .btn { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem 1.25rem; font-weight:600; cursor:pointer; transition:all 0.2s; background: var(--color-surface); color: var(--color-text-primary); }
    .btn.ghost { background: transparent; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color:var(--color-background, #0f172a); box-shadow: var(--shadow-md, 0 10px 24px rgba(0,0,0,0.22)); }
    .pipeline { display:grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap:1rem; }
    .stage { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-md); }
    .stage-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; font-weight:700; color: var(--color-text-primary); }
    .stage-count { background: var(--color-surface-hover); padding:0.25rem 0.6rem; border-radius:8px; font-size:0.8rem; color: var(--color-text-secondary); }
    .stage-list { display:flex; flex-direction:column; gap:0.75rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:0.9rem; box-shadow: var(--shadow-sm); transition:all 0.2s; }
    .card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .app-top { display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; }
    h3 { margin:0; font-size:1rem; color: var(--color-text-primary); }
    .muted { margin:0.15rem 0; color: var(--color-text-secondary); font-size:0.9rem; }
    .pill { background: var(--color-surface-hover); color: var(--color-text-secondary); padding:0.25rem 0.6rem; border-radius:10px; font-size:0.8rem; }
    .app-actions { display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.5rem; }
    .btn-sm { border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); border-radius:8px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer; }
    .btn-sm.ghost { background: transparent; }
    .btn-sm.success { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
    .btn-sm.danger { background: color-mix(in srgb, var(--color-error) 14%, transparent); color: var(--color-error); border-color: color-mix(in srgb, var(--color-error) 30%, transparent); }

    .aside { display:flex; flex-direction:column; gap:1rem; }
    .mini-panel { box-shadow: var(--shadow-md); }
    .mini-panel h3 { margin:0 0 0.75rem; color: var(--color-text-primary); }
    .invoice { display:grid; grid-template-columns: 1fr auto auto; align-items:center; gap:0.5rem; padding:0.5rem 0; border-top:1px solid var(--color-border); }
    .invoice:first-child { border-top:none; }
    .amount { font-weight:700; color: var(--color-text-primary); }
    .pill { padding:0.15rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-secondary); font-size:0.8rem; }
    .pill.paid { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .pill.overdue { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }
    .alert { grid-column:1 / -1; padding:0.75rem 1rem; border-radius:10px; background: color-mix(in srgb, var(--color-error) 10%, transparent); border:1px solid color-mix(in srgb, var(--color-error) 30%, transparent); color: var(--color-error); }
    .banner.info { grid-column:1 / -1; padding:0.75rem 1rem; border-radius:10px; background: rgba(var(--color-primary-rgb,79,139,255),0.12); border:1px solid rgba(var(--color-primary-rgb,79,139,255),0.3); color: var(--color-text-primary); }
    .empty { grid-column: 1 / -1; background: var(--color-surface); border:1px dashed var(--color-border); padding:1rem; border-radius:12px; text-align:center; color: var(--color-text-secondary); }
  `]
})
export class AdmissionsDashboardComponent {
  stages = computed(() => this.admissions.pipelineStages().map(stage => ({ label: stage.label, apps: stage.applications })));

  get recentInvoices() {
    return this.admissions.recentInvoices();
  }

  get defaultPlanName() {
    return this.fees.plans()[0]?.name;
  }

  constructor(
    public admissions: AdmissionsService,
    private fees: FeesService
  ) {}

  refresh() {
    this.admissions.refresh();
  }

  updateStatus(app: AdmissionApplication, status: ApplicationStatus, note?: string) {
    this.admissions.updateStatus(app.id, status, note);
  }

  enroll(app: AdmissionApplication) {
    this.updateStatus(app, 'enrolled', 'Auto-enrolled from dashboard');
  }

  pay(inv: any) {
    const balance = (inv.balance ?? inv.amount ?? 0) - (inv.paidAmount ?? 0);
    this.fees.recordPayment(inv.id || inv._id, { amount: balance > 0 ? balance : inv.amount, method: 'cash', reference: 'Admission desk' });
  }
}
