import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent, FormsModule, ModalComponent],
  styleUrls: ['./student-attendance.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <h1 class="themed-heading">Attendance</h1>
          <p class="muted">Mark daily or period attendance with quick filters and summaries.</p>
        </div>
        <div class="actions">
          <app-button variant="secondary" size="sm">Download report</app-button>
          <app-button variant="primary" size="sm" (click)="openMarkModal()">
            <span class="icon" [innerHTML]="icon('attendance')"></span>
            Mark Attendance
          </app-button>
        </div>
      </header>

      <section class="kpi-band">
        <div class="kpi present">
          <span class="eyebrow">Present</span>
          <p class="value">{{ summary.present }}%</p>
          <small class="muted">Target 95%</small>
        </div>
        <div class="kpi alarm">
          <span class="eyebrow">Absent</span>
          <p class="value">{{ summary.absentToday }}</p>
          <small class="muted">Today</small>
        </div>
        <div class="kpi warning">
          <span class="eyebrow">Late</span>
          <p class="value">{{ summary.late }}</p>
          <small class="muted">Today</small>
        </div>
        <div class="kpi info">
          <span class="eyebrow">Excused</span>
          <p class="value">{{ summary.excused }}</p>
          <small class="muted">Approved</small>
        </div>
        <div class="kpi accent">
          <span class="eyebrow">On-time score</span>
          <p class="value">{{ summary.onTimeScore }}%</p>
          <small class="muted">7-day avg</small>
        </div>
      </section>

      <section class="analytics-grid">
        <div class="line-card">
          <div class="chart-header">
            <div>
              <p class="eyebrow">Trend</p>
              <h3 class="themed-heading">Attendance last 30 days</h3>
            </div>
            <span class="muted small">Live</span>
          </div>
          <div class="line-graph" aria-hidden="true">
            <svg viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary-light)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--color-surface)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path class="trend-line" d="M0 80 L40 72 L80 78 L120 60 L160 64 L200 52 L240 58 L280 50" />
              <path class="trend-fill" d="M0 120 L0 80 L40 72 L80 78 L120 60 L160 64 L200 52 L240 58 L280 50 L280 120 Z" />
              <circle class="trend-point" cx="280" cy="50" r="5" />
            </svg>
          </div>
        </div>
        <div class="action-card">
          <div class="action-top">
            <h4 class="themed-heading">Quick Actions</h4>
            <p class="muted">Today vs 7-day avg</p>
            <div class="compare">
              <div>
                <span class="eyebrow">Today</span>
                <p class="value">{{ summary.present }}%</p>
              </div>
              <div>
                <span class="eyebrow">7-day</span>
                <p class="value">{{ summary.onTimeScore }}%</p>
              </div>
            </div>
          </div>
          <app-button variant="primary" size="md" class="primary-glow" (click)="openMarkModal()">
            <span class="icon" [innerHTML]="icon('attendance')"></span>
            Mark attendance
          </app-button>
          <div class="quick-links">
            <button class="ghost-link">Download daily report</button>
            <button class="ghost-link">Notify absentees</button>
          </div>
        </div>
      </section>

      <app-card class="table-card">
        <div class="table-header">
          <h3 class="themed-heading">Roster</h3>
          <div class="filter-rail">
            <div class="toggle-group header-toggle">
              <button class="pill" [class.active]="viewMode==='daily'" (click)="setViewMode('daily')">Daily</button>
              <button class="pill" [class.active]="viewMode==='period'" (click)="setViewMode('period')">By Period</button>
            </div>
            <div class="filters compact">
              <label>
                Grade
                <select [(ngModel)]="selectedGrade">
                  <option value="">All</option>
                  <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
                </select>
              </label>
              <label>
                Class
                <select [(ngModel)]="selectedClass">
                  <option value="">All</option>
                  <option *ngFor="let c of classes" [value]="c">{{ c }}</option>
                </select>
              </label>
            </div>
            <div class="status-chips compact">
              <span class="chip" [class.active]="selectedStatus==='present'" (click)="setStatus('present')">Present</span>
              <span class="chip" [class.active]="selectedStatus==='absent'" (click)="setStatus('absent')">Absent</span>
              <span class="chip" [class.active]="selectedStatus==='late'" (click)="setStatus('late')">Late</span>
              <span class="chip" [class.active]="selectedStatus==='excused'" (click)="setStatus('excused')">Excused</span>
              <button class="chip ghost" (click)="resetFilters()">Clear</button>
            </div>
          </div>
        </div>
        <div class="table">
          <div class="table-head">
            <span>Student</span>
            <span>Status</span>
            <span>{{ viewMode==='daily' ? 'Time' : 'Period' }}</span>
            <span>Note</span>
          </div>
          <div class="table-row" *ngFor="let record of filteredRecords; let i = index" [class.alt]="i % 2 === 1">
            <div class="student-cell">
              <div class="avatar photo" aria-hidden="true"></div>
              <div>
                <p class="strong name">{{ record.student }}</p>
              </div>
            </div>
            <span class="status-cell">
              <span class="badge" [ngClass]="record.status">{{ record.status | titlecase }}</span>
              <span class="muted small">{{ record.class }}</span>
            </span>
            <span>{{ record.time }}</span>
            <span class="muted small">{{ record.note || '—' }}</span>
          </div>
          <div class="table-row empty" *ngIf="!filteredRecords.length">
            <span class="muted" style="grid-column: 1/5">No records match the filters.</span>
          </div>
        </div>
      </app-card>

      <app-modal
        [isOpen]="markModalOpen"
        title="Mark Attendance"
        size="xl"
        [showFooter]="true"
        (closed)="closeMarkModal()"
      >
        <div class="mark-modal">
          <div class="mark-grid">
            <div class="mark-meta card">
              <div class="section-heading">
                <div class="hero-line">
                  <span class="pill-icon"></span>
                  <div>
                    <span class="eyebrow small">Session</span>
                    <h4>Class & time</h4>
                  </div>
                </div>
              </div>
              <div class="mark-filters">
                <div class="field">
                  <label>Grade/Class</label>
                  <select [(ngModel)]="markSelection.class">
                    <option value="">Select class</option>
                    <option *ngFor="let c of classes" [value]="c">{{ c }}</option>
                  </select>
                </div>
                <div class="field">
                  <label>Date</label>
                  <input type="date" [(ngModel)]="markSelection.date" />
                </div>
                <div class="field">
                  <label>Period</label>
                  <select [(ngModel)]="markSelection.period">
                    <option value="">Full day</option>
                    <option *ngFor="let p of periods" [value]="p">{{ p }}</option>
                  </select>
                </div>
              </div>

            </div>

            <div class="mark-table card">
              <div class="bulk-inline">
                <div class="section-heading">
                  <h4>Bulk Attendance Actions</h4>
                </div>
                <div class="status-chips prominent">
                  <span class="chip primary" [class.active]="bulkStatus==='present'" (click)="setBulkStatus('present')">
                    <span class="chip-dot present"></span> Present
                  </span>
                  <span class="chip" [class.active]="bulkStatus==='absent'" (click)="setBulkStatus('absent')">
                    <span class="chip-dot absent"></span> Absent
                  </span>
                  <span class="chip" [class.active]="bulkStatus==='late'" (click)="setBulkStatus('late')">
                    <span class="chip-dot late"></span> Late
                  </span>
                  <span class="chip" [class.active]="bulkStatus==='excused'" (click)="setBulkStatus('excused')">
                    <span class="chip-dot excused"></span> Excused
                  </span>
                  <button class="chip ghost" type="button" (click)="clearBulk()">Clear</button>
                </div>
                <p class="helper">Applies instantly to all students in the list.</p>
                <p class="helper" *ngIf="bulkStatus">Bulk: {{ bulkStatus | titlecase }} ({{ markRoster.length }})</p>
              </div>
              <div class="mark-head">
                <span>Student</span>
                <span>Status</span>
                <span>Note</span>
              </div>
              <div
                class="mark-row"
                *ngFor="let rec of markRoster; let i = index"
                [class.alt]="i % 2 === 1"
                [class.bulk-flash]="rowFlash"
                [class.changed]="rec.changed"
              >
                <div class="student-cell">
                  <div>
                    <p class="strong name">{{ rec.student }}</p>
                    <p class="muted small">{{ rec.class }}</p>
                  </div>
                </div>
                <div class="row-status control-block">
                  <div class="segmented">
                    <button type="button" [class.active]="rec.status==='present'" (click)="setRowStatus(rec,'present')">Present</button>
                    <button type="button" [class.active]="rec.status==='absent'" (click)="setRowStatus(rec,'absent')">Absent</button>
                    <button type="button" [class.active]="rec.status==='late'" (click)="setRowStatus(rec,'late')">Late</button>
                    <button type="button" [class.active]="rec.status==='excused'" (click)="setRowStatus(rec,'excused')">Excused</button>
                  </div>
                </div>
                <div class="row-note control-block" *ngIf="rec.status === 'absent' || rec.status === 'excused'">
                  <div class="note-inline">
                    <button type="button" class="note-btn" (click)="toggleNote(rec)">
                      <span class="icon" [innerHTML]="icon('edit')"></span>
                      Add note
                    </button>
                    <input *ngIf="rec.showNote" type="text" [(ngModel)]="rec.note" placeholder="Add note" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="summary-strip">
            <span>{{ markRoster.length }} students</span>
            <span class="present">Present: {{ markSummary.present }}</span>
            <span class="late">Late: {{ markSummary.late }}</span>
            <span class="excused">Excused: {{ markSummary.excused }}</span>
            <span class="absent">Absent: {{ markSummary.absent }}</span>
          </div>
        </div>
        <div footer class="modal-actions">
          <app-button variant="ghost" size="sm" (click)="closeMarkModal()">Cancel</app-button>
          <app-button variant="primary" size="md" class="primary-glow" (click)="saveMarkedAttendance()">Save</app-button>
        </div>
      </app-modal>
    </div>
  `
})
export class StudentAttendanceComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Attendance' }
  ];

  viewMode: 'daily' | 'period' = 'daily';
  grades = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  classes = ['5A', '5B', '6A', '6B', '7A', '7B', '8A'];
  selectedGrade = '';
  selectedClass = '';
  selectedStatus: 'present' | 'absent' | 'late' | 'excused' | '' = '';

  markModalOpen = false;
  markSelection = { class: '', date: new Date().toISOString().slice(0, 10), period: '' };
  bulkStatus: 'present' | 'absent' | 'late' | 'excused' | '' = '';
  periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'After-school'];

  markRoster = [
    { student: 'Amaka Obi', class: '6B', status: 'present', note: '', showNote: false, changed: false },
    { student: 'Chidi Okeke', class: '5A', status: 'present', note: '', showNote: false, changed: false },
    { student: 'Sara Danjuma', class: '7A', status: 'present', note: '', showNote: false, changed: false },
    { student: 'Lola Ade', class: '8A', status: 'present', note: '', showNote: false, changed: false },
    { student: 'Tunde Cole', class: '6A', status: 'present', note: '', showNote: false, changed: false }
  ];

  summary = {
    present: 96,
    absentToday: 8,
    late: 3,
    excused: 2,
    onTimeScore: 92
  };

  records = [
    { student: 'Amaka Obi', grade: 'Grade 6', class: '6B', status: 'present', time: '08:05', note: '' },
    { student: 'Chidi Okeke', grade: 'Grade 5', class: '5A', status: 'late', time: '08:20', note: 'Bus delay' },
    { student: 'Sara Danjuma', grade: 'Grade 7', class: '7A', status: 'absent', time: '-', note: 'Sick note pending' },
    { student: 'Lola Ade', grade: 'Grade 8', class: '8A', status: 'excused', time: '-', note: 'Medical' },
    { student: 'Tunde Cole', grade: 'Grade 6', class: '6A', status: 'present', time: '08:03', note: '' }
  ];

  rowFlash = false;

  constructor(private icons: IconRegistryService) {}

  icon(name: string) {
    return this.icons.icon(name);
  }

  setViewMode(mode: 'daily' | 'period') {
    this.viewMode = mode;
  }

  setStatus(status: 'present' | 'absent' | 'late' | 'excused' | '') {
    this.selectedStatus = this.selectedStatus === status ? '' : status;
  }

  resetFilters() {
    this.selectedStatus = '';
    this.selectedClass = '';
    this.selectedGrade = '';
  }

  openMarkModal() {
    this.markModalOpen = true;
  }

  closeMarkModal() {
    this.markModalOpen = false;
    this.bulkStatus = '';
  }

  setBulkStatus(status: 'present' | 'absent' | 'late' | 'excused') {
    this.bulkStatus = status;
    this.markRoster = this.markRoster.map(r => ({ ...r, status }));
    this.flashRows();
  }

  clearBulk() {
    this.bulkStatus = '';
  }

  saveMarkedAttendance() {
    // mock save; in real impl send to API
    this.closeMarkModal();
  }

  get filteredRecords() {
    return this.records.filter(r => {
      const matchGrade = !this.selectedGrade || r.grade === this.selectedGrade;
      const matchClass = !this.selectedClass || r.class === this.selectedClass;
      const matchStatus = !this.selectedStatus || r.status === this.selectedStatus;
      return matchGrade && matchClass && matchStatus;
    });
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  setRowStatus(rec: any, status: 'present' | 'absent' | 'late' | 'excused') {
    rec.status = status;
    if (status === 'present') {
      rec.note = '';
    }
    if (status !== 'absent' && status !== 'excused') {
      rec.showNote = false;
    }
    rec.changed = true;
    setTimeout(() => (rec.changed = false), 220);
  }

  toggleNote(rec: any) {
    rec.showNote = !rec.showNote;
  }

  get markSummary() {
    return this.markRoster.reduce(
      (acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0 } as any
    );
  }

  private flashRows() {
    this.rowFlash = false;
    requestAnimationFrame(() => {
      this.rowFlash = true;
      setTimeout(() => (this.rowFlash = false), 180);
    });
  }
}
