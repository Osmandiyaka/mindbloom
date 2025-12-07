import { CommonModule } from '@angular/common';
import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdmissionsApiService, Application } from '../../../apply/services/admissions-api.service';
import { FeesService } from '../../../../core/services/fees.service';

interface PipelineStage {
  status: string;
  label: string;
  apps: Application[];
  count: number;
}

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

      <div *ngIf="error()" class="alert">{{ error() }}</div>
      <div *ngIf="loading()" class="banner info">Loading latest pipeline…</div>

      <section class="info-banner">
        <div>
          <h3>How enrollment works</h3>
          <p class="muted">
            Clicking <strong>Enroll</strong> will create a student record stub, pick your default fee plan ({{ defaultPlanName || 'no plan configured' }}),
            and generate an invoice due in 7 days.
          </p>
        </div>
      </section>

      <div class="pipeline" *ngIf="stages().length > 0; else emptyState">
        <div *ngFor="let stage of stages()" class="stage">
          <div class="stage-header">
            <span class="stage-name">{{ stage.label }}</span>
            <span class="stage-count">{{ stage.count }}</span>
          </div>
          <div class="stage-list">
            <div *ngFor="let app of stage.apps" class="card app-card">
              <div class="app-top">
                <div>
                  <h3>{{ app.firstName }} {{ app.lastName }}</h3>
                  <p class="muted">{{ app.gradeApplying }}</p>
                </div>
                <span class="pill">{{ getStatusLabel(app.status) }}</span>
              </div>
              <p class="muted">{{ app.email }}</p>
              <div class="app-actions">
                <a class="btn-sm ghost" [routerLink]="['/admissions/online/review', app.id]">View</a>
                <button class="btn-sm" [disabled]="busyApplications().has(app.id)" (click)="acceptApplication(app)">
                  {{ busyApplications().has(app.id) ? 'Accepting…' : 'Accept' }}
                </button>
                <button class="btn-sm danger" [disabled]="busyApplications().has(app.id)" (click)="rejectApplication(app)">
                  {{ busyApplications().has(app.id) ? 'Rejecting…' : 'Reject' }}
                </button>
                <button 
                  *ngIf="app.status === 'accepted'" 
                  class="btn-sm success" 
                  [disabled]="busyApplications().has(app.id)" 
                  (click)="enrollStudent(app)"
                >
                  {{ busyApplications().has(app.id) ? 'Enrolling…' : 'Enroll' }}
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
    </div>
  `,
  styles: [`
    .admissions-page { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight: 700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .info-banner { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem 1.25rem; box-shadow: var(--shadow-sm); margin-bottom:1.5rem; }
    .info-banner h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .btn { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem 1.25rem; font-weight:600; cursor:pointer; transition:all 0.2s; background: var(--color-surface); color: var(--color-text-primary); text-decoration: none; display: inline-block; }
    .btn.ghost { background: transparent; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color:white; box-shadow: var(--shadow-md, 0 10px 24px rgba(0,0,0,0.22)); }
    .pipeline { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .stage { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-md); }
    .stage-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; font-weight:700; color: var(--color-text-primary); }
    .stage-count { background: var(--color-surface-hover); padding:0.25rem 0.6rem; border-radius:8px; font-size:0.8rem; color: var(--color-text-secondary); }
    .stage-list { display:flex; flex-direction:column; gap:0.75rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:0.9rem; box-shadow: var(--shadow-sm); transition:all 0.2s; }
    .card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .app-top { display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; }
    h3 { margin:0; font-size:1rem; color: var(--color-text-primary); }
    .muted { margin:0.15rem 0; color: var(--color-text-secondary); font-size:0.9rem; }
    .pill { background: var(--color-surface-hover); color: var(--color-text-secondary); padding:0.25rem 0.6rem; border-radius:10px; font-size:0.8rem; white-space: nowrap; }
    .app-actions { display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.5rem; }
    .btn-sm { border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); border-radius:8px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer; text-decoration: none; display: inline-block; }
    .btn-sm:hover { background: var(--color-surface); }
    .btn-sm.ghost { background: transparent; }
    .btn-sm.success { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
    .btn-sm.danger { background: color-mix(in srgb, var(--color-error) 14%, transparent); color: var(--color-error); border-color: color-mix(in srgb, var(--color-error) 30%, transparent); }
    .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert { padding:0.75rem 1rem; border-radius:10px; background: color-mix(in srgb, var(--color-error) 10%, transparent); border:1px solid color-mix(in srgb, var(--color-error) 30%, transparent); color: var(--color-error); margin-bottom: 1rem; }
    .banner.info { padding:0.75rem 1rem; border-radius:10px; background: rgba(var(--color-primary-rgb,79,139,255),0.12); border:1px solid rgba(var(--color-primary-rgb,79,139,255),0.3); color: var(--color-text-primary); margin-bottom: 1rem; }
    .empty { background: var(--color-surface); border:1px dashed var(--color-border); padding:2rem; border-radius:12px; text-align:center; color: var(--color-text-secondary); }
  `]
})
export class AdmissionsDashboardComponent implements OnInit {
  private admissionsApi = inject(AdmissionsApiService);
  private feesService = inject(FeesService);

  loading = signal(false);
  error = signal<string | null>(null);
  pipelineData = signal<Record<string, { count: number; applications: Application[] }>>({});
  busyApplications = signal<Set<string>>(new Set());

  stages = computed(() => {
    const data = this.pipelineData();
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      waitlisted: 'Waitlisted',
      enrolled: 'Enrolled'
    };

    return Object.entries(data).map(([status, { count, applications }]) => ({
      status,
      label: statusMap[status] || status,
      apps: applications,
      count
    }));
  });

  get defaultPlanName() {
    return this.feesService.plans()[0]?.name;
  }

  ngOnInit() {
    this.loadPipeline();
  }

  async loadPipeline() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.admissionsApi.getPipeline().toPromise();
      this.pipelineData.set(data || {});
    } catch (err: any) {
      this.error.set('Failed to load applications. Please try again.');
      console.error('Pipeline load error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  refresh() {
    this.loadPipeline();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      inquiry: 'Inquiry',
      submitted: 'Submitted',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      waitlisted: 'Waitlisted',
      enrolled: 'Enrolled',
      withdrawn: 'Withdrawn'
    };
    return labels[status] || status;
  }

  async acceptApplication(app: Application) {
    const busy = new Set(this.busyApplications());
    busy.add(app.id);
    this.busyApplications.set(busy);

    try {
      await this.admissionsApi.acceptApplication(app.id).toPromise();
      await this.loadPipeline(); // Reload to update UI
    } catch (err: any) {
      this.error.set(`Failed to accept application: ${err.error?.message || err.message}`);
    } finally {
      const busy = new Set(this.busyApplications());
      busy.delete(app.id);
      this.busyApplications.set(busy);
    }
  }

  async rejectApplication(app: Application) {
    const busy = new Set(this.busyApplications());
    busy.add(app.id);
    this.busyApplications.set(busy);

    try {
      await this.admissionsApi.rejectApplication(app.id).toPromise();
      await this.loadPipeline();
    } catch (err: any) {
      this.error.set(`Failed to reject application: ${err.error?.message || err.message}`);
    } finally {
      const busy = new Set(this.busyApplications());
      busy.delete(app.id);
      this.busyApplications.set(busy);
    }
  }

  async enrollStudent(app: Application) {
    if (app.status !== 'accepted') {
      this.error.set('Only accepted applications can be enrolled');
      return;
    }

    const busy = new Set(this.busyApplications());
    busy.add(app.id);
    this.busyApplications.set(busy);

    try {
      const result = await this.admissionsApi.enrollStudent(app.id).toPromise();
      console.log('Enrollment successful:', result);
      await this.loadPipeline();
    } catch (err: any) {
      this.error.set(`Failed to enroll student: ${err.error?.message || err.message}`);
    } finally {
      const busy = new Set(this.busyApplications());
      busy.delete(app.id);
      this.busyApplications.set(busy);
    }
  }
}
