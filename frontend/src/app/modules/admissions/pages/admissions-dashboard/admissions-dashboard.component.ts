import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdmissionsService } from '../../../../core/services/admissions.service';
import { AdmissionApplication, ApplicationStatus } from '../../../../core/models/admission.model';
import { FeesService } from '../../../../core/services/fees.service';
import { StudentsService } from '../../../../core/services/students.service';

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
          <a routerLink="/admissions/apply" class="btn btn-primary">New Application</a>
        </div>
      </header>

      <div class="pipeline">
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
                <button class="btn-sm ghost" (click)="updateStatus(app, 'in_review')">Review</button>
                <button class="btn-sm success" (click)="updateStatus(app, 'offer')">Offer</button>
                <button class="btn-sm danger" (click)="updateStatus(app, 'rejected')">Reject</button>
                <button class="btn-sm" (click)="enroll(app)">Enroll</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="aside">
        <div class="card mini-panel">
          <h3>Recent Invoices</h3>
          <div class="invoice" *ngFor="let inv of recentInvoices">
            <div>
              <div class="muted">{{ inv.id }} · {{ inv.studentName }}</div>
              <div class="pill" [class.paid]="inv.status === 'paid'" [class.overdue]="inv.status === 'overdue'">{{ inv.status | titlecase }}</div>
            </div>
            <div class="amount">\${{ inv.amount }}</div>
            <button class="btn-sm" [disabled]="inv.status === 'paid'" (click)="pay(inv.id)">Mark Paid</button>
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
    .actions { display:flex; gap:0.75rem; }
    .btn { border:none; border-radius:10px; padding:0.75rem 1.25rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .pipeline { display:grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap:1rem; }
    .stage { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-md); }
    .stage-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; font-weight:700; color: var(--color-text-primary); }
    .stage-count { background: var(--color-surface-hover,#f3f4f6); padding:0.25rem 0.6rem; border-radius:8px; font-size:0.8rem; color: var(--color-text-secondary); }
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
    .btn-sm.success { background: rgba(var(--color-success-rgb,16,185,129),0.15); color: var(--color-success,#10b981); border-color: rgba(var(--color-success-rgb,16,185,129),0.3); }
    .btn-sm.danger { background: rgba(var(--color-error-rgb,239,68,68),0.12); color: var(--color-error,#ef4444); border-color: rgba(var(--color-error-rgb,239,68,68),0.3); }

    .aside { display:flex; flex-direction:column; gap:1rem; }
    .mini-panel { box-shadow: var(--shadow-md); }
    .mini-panel h3 { margin:0 0 0.75rem; color: var(--color-text-primary); }
    .invoice { display:grid; grid-template-columns: 1fr auto auto; align-items:center; gap:0.5rem; padding:0.5rem 0; border-top:1px solid var(--color-border); }
    .invoice:first-child { border-top:none; }
    .amount { font-weight:700; color: var(--color-text-primary); }
    .pill { padding:0.15rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-secondary); font-size:0.8rem; }
    .pill.paid { background: rgba(var(--color-success-rgb,16,185,129),0.15); color: var(--color-success,#10b981); }
    .pill.overdue { background: rgba(var(--color-error-rgb,239,68,68),0.15); color: var(--color-error,#ef4444); }
  `]
})
export class AdmissionsDashboardComponent {
  stages = computed(() => {
    const list = this.admissions.applications();
    const labels: { label: string; key: ApplicationStatus }[] = [
      { label: 'Inquiry', key: 'inquiry' },
      { label: 'Submitted', key: 'submitted' },
      { label: 'In Review', key: 'in_review' },
      { label: 'Offer', key: 'offer' },
      { label: 'Waitlist', key: 'waitlist' },
      { label: 'Rejected', key: 'rejected' },
      { label: 'Enrolled', key: 'enrolled' },
    ];
    return labels.map(stage => ({
      label: stage.label,
      apps: list.filter(app => app.status === stage.key)
    })).filter(stage => stage.apps.length > 0);
  });

  get recentInvoices() {
    return this.fees.invoices().slice(0, 5);
  }

  constructor(
    private admissions: AdmissionsService,
    private fees: FeesService,
    private students: StudentsService
  ) {}

  updateStatus(app: AdmissionApplication, status: ApplicationStatus) {
    this.admissions.updateStatus(app.id, status);
  }

  enroll(app: AdmissionApplication) {
    this.students.createFromAdmission({ name: app.applicantName, grade: app.gradeApplying, email: app.email });
    const planId = this.fees.defaultPlanId();
    if (planId) {
      this.fees.addInvoice({
        studentName: app.applicantName,
        planId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        amount: this.fees.plans().find(p => p.id === planId)?.amount || 0,
        reference: `ADM-${app.id}`
      });
    }
    this.updateStatus(app, 'enrolled');
  }

  pay(id: string) {
    this.fees.recordPayment(id);
  }
}
