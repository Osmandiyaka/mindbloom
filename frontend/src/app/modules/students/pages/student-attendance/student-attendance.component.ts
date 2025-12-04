import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent, FormsModule],
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
          <app-button variant="primary" size="sm">
            <span class="icon" [innerHTML]="icon('attendance')"></span>
            Mark Attendance
          </app-button>
        </div>
      </header>

      <section class="toolbar card">
        <div class="toggle-group">
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
          <div class="status-chips">
            <span class="chip" [class.active]="selectedStatus==='present'" (click)="setStatus('present')">Present</span>
            <span class="chip" [class.active]="selectedStatus==='absent'" (click)="setStatus('absent')">Absent</span>
            <span class="chip" [class.active]="selectedStatus==='late'" (click)="setStatus('late')">Late</span>
            <span class="chip" [class.active]="selectedStatus==='excused'" (click)="setStatus('excused')">Excused</span>
            <button class="chip ghost" (click)="resetFilters()">Clear</button>
          </div>
        </div>
        <div class="summary-bar">
          <div>
            <p class="label">Present</p>
            <p class="value success">{{ summary.present }}%</p>
          </div>
          <div>
            <p class="label">Absent today</p>
            <p class="value">{{ summary.absentToday }}</p>
          </div>
          <div>
            <p class="label">Alerts</p>
            <p class="value warning">{{ summary.alerts }}</p>
          </div>
        </div>
      </section>

      <app-card class="table-card">
        <div class="card-header table-header">
          <h3 class="themed-heading">Roster</h3>
          <p class="muted small">Filtered: {{ filteredRecords.length }} students</p>
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

  summary = {
    present: 96,
    absentToday: 8,
    alerts: 3
  };

  records = [
    { student: 'Amaka Obi', grade: 'Grade 6', class: '6B', status: 'present', time: '08:05', note: '' },
    { student: 'Chidi Okeke', grade: 'Grade 5', class: '5A', status: 'late', time: '08:20', note: 'Bus delay' },
    { student: 'Sara Danjuma', grade: 'Grade 7', class: '7A', status: 'absent', time: '-', note: 'Sick note pending' },
    { student: 'Lola Ade', grade: 'Grade 8', class: '8A', status: 'excused', time: '-', note: 'Medical' },
    { student: 'Tunde Cole', grade: 'Grade 6', class: '6A', status: 'present', time: '08:03', note: '' }
  ];

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
}
