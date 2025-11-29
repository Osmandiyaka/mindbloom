import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdmissionsService } from '../../../../core/services/admissions.service';
import { AdmissionApplication, ApplicationStatus } from '../../../../core/models/admission.model';

@Component({
  selector: 'app-online-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="page-shell" *ngIf="application(); else missing">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Review</p>
          <h2>Application #{{ applicationId }}</h2>
          <p class="muted">Review details, documents, and make a decision.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="setStatus('review')">Move to Review</button>
          <button class="btn" (click)="setStatus('enrolled')">Enroll</button>
          <button class="btn danger" (click)="setStatus('rejected')">Reject</button>
        </div>
      </header>

      <div class="layout">
        <div class="left">
          <div class="panel">
            <div class="panel-header">
              <div>
                <div class="pill status" [class.review]="application()?.status === 'review'" [class.approved]="application()?.status === 'enrolled'" [class.rejected]="application()?.status === 'rejected'">
                  {{ application()?.status | titlecase }}
                </div>
                <h3>{{ application()?.applicantName }}</h3>
                <p class="muted">{{ application()?.gradeApplying }} • {{ application()?.email }} • {{ application()?.phone }}</p>
              </div>
              <div class="meta">
                <div>Applied: {{ application()?.submittedAt | date:'mediumDate' }}</div>
                <div>Days pending: 3</div>
              </div>
            </div>

            <div class="tabs">
              <button *ngFor="let tab of tabs" class="tab" [class.active]="activeTab() === tab" (click)="activeTab.set(tab)">
                {{ tab }}
              </button>
            </div>

            <div class="tab-body" *ngIf="activeTab() === 'Personal Info'">
              <div class="grid">
                <div><label>Student Name</label><div class="strong">{{ application()?.applicantName }}</div></div>
                <div><label>Grade Applied</label><div>{{ application()?.gradeApplying }}</div></div>
                <div><label>Parent Name</label><div>{{ applicant.parent }}</div></div>
                <div><label>Parent Contact</label><div>{{ applicant.parentPhone }}</div></div>
              </div>
              <div><label>Notes</label><p class="muted">{{ applicant.notes }}</p></div>
            </div>

            <div class="tab-body" *ngIf="activeTab() === 'Documents'">
              <div class="doc-list">
                <div class="doc-row" *ngFor="let doc of applicant.documents">
                  <div>
                    <div class="strong">{{ doc.name }}</div>
                    <div class="muted small">{{ doc.type }}</div>
                  </div>
                  <button class="btn tiny ghost">View</button>
                </div>
              </div>
            </div>

            <div class="tab-body" *ngIf="activeTab() === 'Review History'">
              <div class="timeline">
                <div class="timeline-item" *ngFor="let item of reviewHistory">
                  <div class="dot"></div>
                  <div>
                    <div class="strong">{{ item.action }}</div>
                    <div class="muted small">{{ item.by }} · {{ item.date | date:'medium' }}</div>
                    <p class="muted">{{ item.note }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right">
          <div class="panel">
            <h4>Decision</h4>
            <label>Recommendation</label>
            <select [(ngModel)]="recommendation">
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="waitlist">Waitlist</option>
            </select>
            <label>Comments</label>
            <textarea [(ngModel)]="comment" rows="4" placeholder="Add review notes..."></textarea>
            <button class="btn primary full" (click)="saveDecision()">Save Decision</button>
          </div>
          <div class="panel">
            <h4>Score</h4>
            <div class="grid two">
              <label>Academic</label><input type="range" min="0" max="10" [(ngModel)]="scores.academic">
              <label>Extra-curricular</label><input type="range" min="0" max="10" [(ngModel)]="scores.ec">
              <label>Interview</label><input type="range" min="0" max="10" [(ngModel)]="scores.interview">
              <label>Overall fit</label><input type="range" min="0" max="10" [(ngModel)]="scores.fit">
            </div>
            <div class="strong">Total: {{ totalScore() }}/40</div>
          </div>
        </div>
      </div>
    </section>
    <ng-template #missing>
      <section class="page-shell">
        <p class="muted">Application not found.</p>
      </section>
    </ng-template>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}`,
    `.page-header{display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;}`,
    `.eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0; color:var(--color-text-secondary);}`,
    `.actions{display:flex; gap:0.4rem; flex-wrap:wrap;}`,
    `.btn{border:1px solid var(--color-border); border-radius:7px; padding:0.32rem 0.65rem; font-weight:600; cursor:pointer; background:var(--color-surface); color:var(--color-text-primary); line-height:1; font-size:0.95rem; height:34px;}`,
    `.btn.primary{background:linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow:0 8px 20px rgba(var(--color-primary-rgb,123,140,255),0.35);}`,
    `.btn.ghost{background:transparent;}`,
    `.btn.danger{background:rgba(var(--color-error-rgb,239,68,68),0.12); color:var(--color-error,#ef4444); border-color:rgba(var(--color-error-rgb,239,68,68),0.4);}`,
    `.btn.tiny{padding:0.3rem 0.55rem; font-size:0.85rem; border-radius:8px;}`,
    `.btn.full{width:100%; margin-top:0.6rem;}`,
    `.layout{display:grid; grid-template-columns:2fr 1fr; gap:1rem; align-items:start;}`,
    `.panel{background:var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem 1.1rem; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:0.75rem;}`,
    `.panel-header{display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;}`,
    `.meta{color:var(--color-text-secondary); font-size:0.9rem;}`,
    `.pill.status{padding:0.25rem 0.6rem; border-radius:10px; background:var(--color-surface-hover); color:var(--color-text-secondary); font-size:0.85rem; display:inline-block; margin-bottom:0.35rem;}`,
    `.pill.status.review{background:rgba(var(--color-warning-rgb,245,158,11),0.12); color:var(--color-warning,#f59e0b);}`,
    `.pill.status.approved{background:rgba(var(--color-success-rgb,16,185,129),0.15); color:var(--color-success,#10b981);}`,
    `.pill.status.rejected{background:rgba(var(--color-error-rgb,239,68,68),0.15); color:var(--color-error,#ef4444);}`,
    `.tabs{display:flex; gap:0.5rem; flex-wrap:wrap;}`,
    `.tab{padding:0.45rem 0.8rem; border-radius:10px; border:1px solid var(--color-border); background:var(--color-surface); cursor:pointer;}`,
    `.tab.active{background:linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none;}`,
    `.tab-body{border-top:1px solid var(--color-border); padding-top:0.75rem;}`,
    `.grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem;}`,
    `.grid.two{grid-template-columns:repeat(2,1fr);}`,
    `label{display:block; font-weight:600; color:var(--color-text-primary); margin-bottom:0.2rem;}`,
    `.strong{font-weight:700; color:var(--color-text-primary);}`,
    `.doc-list{display:flex; flex-direction:column; gap:0.5rem;}`,
    `.doc-row{display:flex; justify-content:space-between; align-items:center; padding:0.55rem; border:1px solid var(--color-border); border-radius:10px;}`,
    `.timeline{display:flex; flex-direction:column; gap:0.75rem;}`,
    `.timeline-item{display:flex; gap:0.6rem;}`,
    `.timeline-item .dot{width:10px; height:10px; border-radius:999px; background:var(--color-primary,#7ab8ff); margin-top:0.35rem;}`,
    `select, textarea, input[type=\"range\"]{width:100%; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:0.45rem 0.55rem; color:var(--color-text-primary);}`,
    `textarea{resize:vertical;}`,
    `.right{display:flex; flex-direction:column; gap:1rem;}`
  ]
})
export class OnlineReviewComponent {
  applicationId = '';
  activeTab = signal<'Personal Info' | 'Documents' | 'Review History'>('Personal Info');
  tabs: Array<'Personal Info' | 'Documents' | 'Review History'> = ['Personal Info', 'Documents', 'Review History'];
  recommendation = 'approve';
  comment = '';
  scores = { academic: 8, ec: 7, interview: 8, fit: 9 };
  reviewHistory = [
    { action: 'Submitted application', by: 'Parent Portal', date: new Date(), note: 'Initial submission' },
    { action: 'Moved to review', by: 'Admissions Bot', date: new Date(), note: 'Auto stage change' },
  ];
  applicant = {
    name: 'Amaka Obi',
    grade: 'Grade 6',
    email: 'amaka@school.com',
    phone: '+2348011111111',
    parent: 'Mr. Obi',
    parentPhone: '+2348099999999',
    applied: new Date(),
    notes: 'Prefers morning sessions; interested in STEM club.',
    documents: [
      { name: 'Birth Certificate', type: 'PDF' },
      { name: 'Report Card', type: 'PDF' },
      { name: 'ID Photo', type: 'Image' },
    ],
  };

  application = computed<AdmissionApplication | undefined>(() => {
    return this.admissions.getApplication(this.applicationId) ?? this.fallbackApplication();
  });

  constructor(route: ActivatedRoute, private readonly admissions: AdmissionsService) {
    this.applicationId = route.snapshot.paramMap.get('id') ?? '';
    this.admissions.refresh();
  }

  totalScore() {
    return this.scores.academic + this.scores.ec + this.scores.interview + this.scores.fit;
  }

  setStatus(next: ApplicationStatus) {
    if (!this.application()) return;
    this.admissions.setApplicationStatusLocal(this.application()!.id, next, this.comment || 'Updated in review');
    this.reviewHistory = [
      { action: `Status set to ${next}`, by: 'You', date: new Date(), note: this.comment || 'No comment' },
      ...this.reviewHistory,
    ];
  }

  saveDecision() {
    this.reviewHistory = [
      { action: `Decision: ${this.recommendation}`, by: 'You', date: new Date(), note: this.comment || 'No comment' },
      ...this.reviewHistory,
    ];
  }

  private fallbackApplication(): AdmissionApplication {
    return {
      id: this.applicationId || 'mock-review',
      applicantName: this.applicant.name,
      gradeApplying: this.applicant.grade,
      email: this.applicant.email,
      phone: this.applicant.phone,
      status: 'review',
      submittedAt: new Date(),
      updatedAt: new Date(),
      notes: this.applicant.notes,
      documents: [],
    };
  }
}
