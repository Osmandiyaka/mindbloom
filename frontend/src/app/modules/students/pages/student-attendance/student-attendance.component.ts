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

      <section class="stat-hero">
        <div class="stat-chip present">
          <div class="chip-head">
            <span class="dot present"></span>
            <span class="label">Present</span>
          </div>
          <p class="stat-value">{{ summary.present }}%</p>
          <div class="sparkline">
            <span class="bar h70"></span>
            <span class="bar h85"></span>
            <span class="bar h90"></span>
            <span class="bar h80"></span>
            <span class="bar h95"></span>
          </div>
        </div>
        <div class="stat-chip absent">
          <div class="chip-head">
            <span class="dot absent"></span>
            <span class="label">Absent</span>
          </div>
          <p class="stat-value">{{ summary.absentToday }}</p>
          <div class="sparkline">
            <span class="bar h30"></span>
            <span class="bar h40"></span>
            <span class="bar h25"></span>
            <span class="bar h35"></span>
            <span class="bar h20"></span>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="themed-heading">Trend</h3>
            <p class="muted">Last 7 days</p>
          </div>
          <div class="chart-bars" aria-hidden="true">
            <div class="bar" style="height: 78%"><span>Mon</span></div>
            <div class="bar" style="height: 82%"><span>Tue</span></div>
            <div class="bar" style="height: 76%"><span>Wed</span></div>
            <div class="bar" style="height: 88%"><span>Thu</span></div>
            <div class="bar" style="height: 91%"><span>Fri</span></div>
            <div class="bar" style="height: 73%"><span>Mon</span></div>
            <div class="bar" style="height: 85%"><span>Tue</span></div>
          </div>
        </div>
      </section>

      <app-card class="table-card">
        <div class="card-header table-header">
          <h3 class="themed-heading">Roster</h3>
          <div class="header-filters">
            <div class="header-chips">
              <div class="toggle-group header-toggle">
                <button class="pill" [class.active]="viewMode==='daily'" (click)="setViewMode('daily')">Daily</button>
                <button class="pill" [class.active]="viewMode==='period'" (click)="setViewMode('period')">By Period</button>
              </div>
              <div class="filters">
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
        </div>
        <div class="table">
          <div class="table-head">
            <span>Student</span>
            <span>Class</span>
            <span>Status</span>
            <span>{{ viewMode==='daily' ? 'Time' : 'Period' }}</span>
            <span>Note</span>
          </div>
          <div class="table-row" *ngFor="let record of filteredRecords; let i = index" [class.alt]="i % 2 === 1">
            <div class="student-cell">
              <div class="avatar">{{ initials(record.student) }}</div>
              <div>
                <p class="strong">{{ record.student }}</p>
                <p class="muted small">{{ record.grade }}</p>
              </div>
            </div>
            <span>{{ record.class }}</span>
            <span>
              <span class="badge" [ngClass]="record.status">{{ record.status | titlecase }}</span>
            </span>
            <span>{{ record.time }}</span>
            <span class="muted small">{{ record.note || '—' }}</span>
          </div>
          <div class="table-row empty" *ngIf="!filteredRecords.length">
            <span class="muted" style="grid-column: 1/6">No records match the filters.</span>
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

              <div class="bulk-status">
                <div class="section-heading">
                  <span class="eyebrow small">Apply Status to All</span>
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
            </div>

            <div class="mark-table card">
              <div class="mark-head">
                <span>Student</span>
                <span>Status</span>
                <span>Note</span>
              </div>
              <div class="mark-row" *ngFor="let rec of markRoster; let i = index" [class.alt]="i % 2 === 1" [class.bulk-flash]="rowFlash">
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
                <div class="row-note control-block" *ngIf="rec.status !== 'present'">
                  <input type="text" [(ngModel)]="rec.note" placeholder="Add note" />
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
    { student: 'Amaka Obi', class: '6B', status: 'present', note: '' },
    { student: 'Chidi Okeke', class: '5A', status: 'present', note: '' },
    { student: 'Sara Danjuma', class: '7A', status: 'present', note: '' },
    { student: 'Lola Ade', class: '8A', status: 'present', note: '' },
    { student: 'Tunde Cole', class: '6A', status: 'present', note: '' }
  ];

  summary = {
    present: 96,
    absentToday: 8
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
