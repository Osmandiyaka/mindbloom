import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-student-academics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BreadcrumbsComponent, CardComponent, ButtonComponent, ModalComponent, NgIf, NgFor],
  styleUrls: ['./student-academics.component.scss'],
  template: `
    <app-modal
      [isOpen]="newEntryOpen"
      title="New Grade Entry"
      size="xl"
      [showFooter]="true"
      (closed)="closeNewEntry()"
    >
      <div class="grade-modal">
        <div class="modal-titleline">
          <span class="icon" [innerHTML]="icon('academics')"></span>
          <div>
            <p class="eyebrow small">New Grade Entry</p>
            <h3>Configure assessment</h3>
          </div>
        </div>
        <div class="modal-grid">
          <div class="panel neon">
            <p class="eyebrow">Assessment info</p>
            <div class="field-grid">
              <label>
                Subject / course
                <select [(ngModel)]="gradeEntry.subject">
                  <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
                </select>
              </label>
              <label>
                Term
                <select [(ngModel)]="gradeEntry.term">
                  <option *ngFor="let t of terms" [value]="t">{{ t }}</option>
                </select>
              </label>
              <label>
                Grade
                <select [(ngModel)]="gradeEntry.grade">
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
                </select>
              </label>
              <label>
                Class / Section
                <select [(ngModel)]="gradeEntry.classSection">
                  <option *ngFor="let c of classes" [value]="c">{{ c }}</option>
                </select>
              </label>
              <label>
                Assessment type
                <select [(ngModel)]="gradeEntry.type">
                  <option *ngFor="let t of assessmentTypes" [value]="t">{{ t }}</option>
                </select>
              </label>
              <label>
                Due / Date
                <input type="date" [(ngModel)]="gradeEntry.dueDate" />
              </label>
            </div>
            <label>
              Description
              <textarea rows="2" [(ngModel)]="gradeEntry.description" placeholder="Short description or instructions"></textarea>
            </label>
          </div>

          <div class="panel neon">
            <p class="eyebrow">Scoring & weighting</p>
            <div class="field-grid small">
              <label>
                Max score
                <input type="number" min="0" [(ngModel)]="gradeEntry.maxScore" placeholder="100" />
              </label>
              <label>
                Weight (%)
                <input type="number" min="0" max="100" [(ngModel)]="gradeEntry.weight" placeholder="20" />
              </label>
              <label>
                Category
                <select [(ngModel)]="gradeEntry.category">
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </label>
              <label>
                Lock after posting
                <select [(ngModel)]="gradeEntry.locking">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
            <div class="toggle-card">
              <p class="muted small">Post settings</p>
              <div class="quick-toggles">
                <button type="button" class="toggle-chip" title="Automatically derive letter grades based on scale" [class.active]="gradeEntry.autoCalc" (click)="gradeEntry.autoCalc = !gradeEntry.autoCalc">
                <span class="icon tiny" [innerHTML]="icon('spark')"></span>
                <span class="label">Auto-calc letter grade</span>
                <span class="mark" [innerHTML]="icon('check')"></span>
              </button>
                <button type="button" class="toggle-chip" title="Make grades visible to students/parents when posted" [class.active]="gradeEntry.publish" (click)="gradeEntry.publish = !gradeEntry.publish">
                <span class="icon tiny" [innerHTML]="icon('publish')"></span>
                <span class="label">Publish to portal</span>
                <span class="mark" [innerHTML]="icon('check')"></span>
              </button>
                <button type="button" class="toggle-chip" title="Accept late submissions and mark accordingly" [class.active]="gradeEntry.allowLate" (click)="gradeEntry.allowLate = !gradeEntry.allowLate">
                <span class="icon tiny" [innerHTML]="icon('clock')"></span>
                <span class="label">Allow late submissions</span>
                <span class="mark" [innerHTML]="icon('check')"></span>
              </button>
              </div>
            </div>
            <div class="summary">
              <div class="preview-tile">
                <p class="muted xs">Preview</p>
                <p class="strong mono">Max {{ gradeEntry.maxScore || '—' }} · Weight {{ gradeEntry.weight || '—' }}% · {{ gradeEntry.type || 'Assessment' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div footer class="modal-footer-bar">
        <app-button variant="ghost" size="sm" (click)="closeNewEntry()">Cancel</app-button>
        <app-button variant="primary" size="sm" (click)="saveNewEntry()">
          <span class="icon" [innerHTML]="icon('save')"></span>
          Save grade entry
        </app-button>
      </div>
    </app-modal>

    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div class="header-left">
          <p class="muted" *ngIf="isAdmin()">School-wide grade entry, report cards, and GPA summaries.</p>
          <p class="muted" *ngIf="isTeacher()">My classes: {{ teacherClasses.join(', ') }} · Tasks: {{ teacherTasks.length }}</p>
          <ul class="muted small teacher-tasks" *ngIf="isTeacher()">
            <li *ngFor="let t of teacherTasks">{{ t }}</li>
          </ul>
        </div>
      </header>

      <div class="action-rail">
        <app-button variant="secondary" size="sm">Download report</app-button>
        <app-button variant="secondary" size="sm">Export CSV/PDF</app-button>
        <app-button variant="primary" size="sm" (click)="openNewEntry()">
          <span class="icon" [innerHTML]="icon('academics')"></span>
          New Grade Entry
        </app-button>
      </div>

      <section class="scope-bar" [class.collapsed]="!scopeOpen">
        <div class="scope-head">
          <div class="scope-actions">
            <button class="chip ghost" type="button" (click)="resetFilters()">Reset</button>
            <button class="chip ghost mobile-toggle" type="button" (click)="scopeOpen = !scopeOpen">
              {{ scopeOpen ? 'Hide' : 'Show' }} filters
            </button>
          </div>
        </div>
        <div class="scope-filters">
          <label>
            Term
            <select [(ngModel)]="selectedTerm">
              <option *ngFor="let t of terms" [value]="t">{{ t }}</option>
            </select>
          </label>
          <label>
            Academic Year
            <select [(ngModel)]="selectedYear">
              <option *ngFor="let y of years" [value]="y">{{ y }}</option>
            </select>
          </label>
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
        <div class="quick-actions">
          <app-button variant="secondary" size="sm">Import Grades</app-button>
          <app-button variant="secondary" size="sm">Generate Report Cards</app-button>
          <app-button variant="secondary" size="sm">Export CSV/PDF</app-button>
        </div>
      </section>

      <section class="kpi-band">
        <div class="kpi info">
          <span class="eyebrow">Pending grade entries</span>
          <p class="value">{{ metrics.pending }}</p>
          <small class="muted">Awaiting posting</small>
          <div class="mini-spark">
            <span class="spark-bar h65"></span>
            <span class="spark-bar h60"></span>
            <span class="spark-bar h72"></span>
            <span class="spark-bar h68"></span>
            <span class="spark-bar h64"></span>
          </div>
        </div>
        <div class="kpi accent">
          <span class="eyebrow">Posted entries</span>
          <p class="value">{{ metrics.posted }}%</p>
          <span class="delta" [class.up]="metrics.postedDelta >= 0" [class.down]="metrics.postedDelta < 0">
            {{ metrics.postedDelta >= 0 ? '▲' : '▼' }} {{ metrics.postedDelta | number:'1.0-1' }}% vs last term
          </span>
          <small class="muted">Across selected scope</small>
          <div class="mini-spark">
            <span class="spark-bar h70"></span>
            <span class="spark-bar h72"></span>
            <span class="spark-bar h75"></span>
            <span class="spark-bar h72"></span>
            <span class="spark-bar h74"></span>
          </div>
        </div>
        <div class="kpi">
          <span class="eyebrow">Report cards in queue</span>
          <p class="value">{{ metrics.reportQueue }}</p>
          <small class="muted">Proofing/ready</small>
          <div class="mini-spark">
            <span class="spark-bar h60"></span>
            <span class="spark-bar h62"></span>
            <span class="spark-bar h58"></span>
            <span class="spark-bar h61"></span>
            <span class="spark-bar h59"></span>
          </div>
        </div>
        <div class="kpi">
          <span class="eyebrow">GPA avg</span>
          <p class="value">{{ metrics.gpaAvg }}</p>
          <span class="delta" [class.up]="metrics.gpaDelta >= 0" [class.down]="metrics.gpaDelta < 0">
            {{ metrics.gpaDelta >= 0 ? '▲' : '▼' }} {{ metrics.gpaDelta | number:'1.1-2' }}
          </span>
          <small class="muted">Range {{ metrics.gpaMin }} - {{ metrics.gpaMax }}</small>
          <div class="mini-spark">
            <span class="spark-bar h60"></span>
            <span class="spark-bar h70"></span>
            <span class="spark-bar h65"></span>
            <span class="spark-bar h75"></span>
            <span class="spark-bar h72"></span>
          </div>
        </div>
        <div class="kpi alarm">
          <span class="eyebrow">Failing students</span>
          <p class="value">{{ metrics.failing }}</p>
          <small class="muted">Need intervention</small>
          <div class="mini-spark">
            <span class="spark-bar h58 error"></span>
            <span class="spark-bar h60 error"></span>
            <span class="spark-bar h55 error"></span>
            <span class="spark-bar h62 error"></span>
            <span class="spark-bar h57 error"></span>
          </div>
        </div>
        <div class="kpi accent">
          <span class="eyebrow">Top performers</span>
          <p class="value">{{ metrics.topPerformers }}</p>
          <span class="delta" [class.up]="metrics.topDelta >= 0" [class.down]="metrics.topDelta < 0">
            {{ metrics.topDelta >= 0 ? '▲' : '▼' }} {{ metrics.topDelta | number:'1.0-0' }}
          </span>
          <small class="muted">GPA &gt; 4.0</small>
          <div class="mini-spark">
            <span class="spark-bar h70 success"></span>
            <span class="spark-bar h72 success"></span>
            <span class="spark-bar h75 success"></span>
            <span class="spark-bar h78 success"></span>
            <span class="spark-bar h80 success"></span>
          </div>
        </div>
      </section>

      <section class="analytics-grid">
        <app-card class="dist-card">
          <div class="card-header">
            <h3 class="themed-heading">GPA Distribution</h3>
            <p class="muted small">Current scope</p>
          </div>
          <div class="bars">
            <svg viewBox="0 0 260 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <linearGradient id="barLow" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="var(--color-surface)" />
                  <stop offset="100%" stop-color="color-mix(in srgb, var(--color-primary-light) 60%, transparent)" />
                </linearGradient>
                <linearGradient id="barMid" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="var(--color-surface)" />
                  <stop offset="100%" stop-color="color-mix(in srgb, var(--color-info) 70%, transparent)" />
                </linearGradient>
                <linearGradient id="barHigh" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="var(--color-surface)" />
                  <stop offset="100%" stop-color="color-mix(in srgb, var(--color-success) 75%, transparent)" />
                </linearGradient>
                <linearGradient id="barTop" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="var(--color-surface)" />
                  <stop offset="100%" stop-color="color-mix(in srgb, var(--color-primary) 80%, transparent)" />
                </linearGradient>
              </defs>
              <g class="grid">
                <line x1="0" y1="120" x2="260" y2="120" />
                <line x1="0" y1="90" x2="260" y2="90" />
                <line x1="0" y1="60" x2="260" y2="60" />
              </g>
              <g class="bars-fill">
                <rect x="10"  y="70" width="40" height="50" rx="8" fill="url(#barLow)" />
                <rect x="60"  y="55" width="40" height="65" rx="8" fill="url(#barLow)" />
                <rect x="110" y="40" width="40" height="80" rx="8" fill="url(#barMid)" />
                <rect x="160" y="25" width="40" height="95" rx="8" fill="url(#barHigh)" />
                <rect x="210" y="15" width="40" height="105" rx="8" fill="url(#barTop)" />
              </g>
              <g class="labels" font-size="12" fill="var(--color-text-secondary)">
                <text x="30"  y="135" text-anchor="middle">0-1</text>
                <text x="80"  y="135" text-anchor="middle">1-2</text>
                <text x="130" y="135" text-anchor="middle">2-3</text>
                <text x="180" y="135" text-anchor="middle">3-3.5</text>
                <text x="230" y="135" text-anchor="middle">3.5-4.0</text>
              </g>
            </svg>
          </div>
        </app-card>

        <app-card class="trend-card">
          <div class="card-header">
            <h3 class="themed-heading">Performance over time</h3>
            <p class="muted small">Term vs previous</p>
          </div>
          <div class="line-graph" aria-hidden="true">
            <svg viewBox="0 0 260 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gpaFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary-light)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--color-surface)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path class="line-current" d="M0 80 L40 70 L80 68 L120 60 L160 62 L200 58 L240 54" />
              <path class="fill-current" d="M0 120 L0 80 L40 70 L80 68 L120 60 L160 62 L200 58 L240 54 L240 120 Z" />
              <path class="line-prev" d="M0 90 L40 82 L80 80 L120 74 L160 76 L200 72 L240 70" />
              <circle class="line-point" cx="240" cy="54" r="4" />
            </svg>
            <div class="tip">Now {{ metrics.gpaAvg }}</div>
          </div>
          <div class="compare-row">
            <div>
              <p class="eyebrow">Current term</p>
              <p class="value small">{{ metrics.gpaAvg }}</p>
            </div>
            <div>
              <p class="eyebrow">Previous term</p>
              <p class="value small">{{ metrics.gpaPrev }}</p>
            </div>
          </div>
        </app-card>
      </section>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3 class="themed-heading">Gradebook status</h3>
          </div>
          <ul class="list gradebook-list">
            <li *ngFor="let item of gradebookStatus">
              <div class="title-line">
                <span class="icon" [innerHTML]="icon(item.icon)"></span>
                <div>
                  <p class="strong">{{ item.subject }}</p>
                  <p class="muted small">{{ item.meta }}</p>
                </div>
              </div>
              <span class="status-pill" [ngClass]="item.state">{{ item.stateLabel }}</span>
            </li>
          </ul>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3 class="themed-heading">Interventions & alerts</h3>
          </div>
          <ul class="list report-list">
            <li *ngFor="let item of interventions">
              <div>
                <p class="strong">{{ item.title }}</p>
                <p class="muted small">{{ item.detail }}</p>
              </div>
              <div class="intervene-actions">
                <span class="priority-pill" [ngClass]="item.priority">{{ item.priorityLabel }}</span>
                <span class="status-pill" [ngClass]="item.state">{{ item.stateLabel }}</span>
                <app-button variant="ghost" size="sm">Resolve</app-button>
              </div>
            </li>
          </ul>
        </app-card>
      </section>
    </div>
  `
})
export class StudentAcademicsComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Academics' }
  ];

  terms = ['Term 1', 'Term 2', 'Term 3'];
  years = ['2024/2025', '2023/2024', '2022/2023'];
  grades = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  classes = ['5A', '5B', '6A', '6B', '7A', '7B', '8A'];
  subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
  assessmentTypes = ['Quiz', 'Test', 'Exam', 'Project', 'Assignment'];
  categories = ['Homework', 'Quiz', 'Exam', 'Project', 'Participation'];

  userRole: 'admin' | 'teacher' = 'admin';
  teacherClasses = ['6A', '6B', '7A'];
  teacherTasks = [
    'Post Algebra quiz for 6A/6B',
    'Finalize Science lab scores for 7A',
    'Prepare report card comments for 6B'
  ];

  scopeOpen = true;
  selectedTerm = this.terms[0];
  selectedYear = this.years[0];
  selectedGrade = '';
  selectedClass = '';

  metrics = {
    pending: 14,
    posted: 78,
    reportQueue: 6,
    gpaAvg: 3.4,
    gpaPrev: 3.2,
    gpaDelta: 0.2,
    gpaMin: 2.8,
    gpaMax: 3.9,
    failing: 4,
    topPerformers: 9,
    topDelta: 2,
    postedDelta: 4.5
  };

  gradebookStatus = [
    { subject: 'Mathematics · Grade 6', meta: 'Due Friday · Quiz 3', state: 'due', stateLabel: 'Due', icon: 'book' },
    { subject: 'Science · Grade 7', meta: '40% posted · Lab report', state: 'progress', stateLabel: 'Posting', icon: 'science' },
    { subject: 'English · Grade 5', meta: 'Draft entries · Essay', state: 'draft', stateLabel: 'Draft', icon: 'edit' }
  ];

  interventions = [
    { title: 'Students below GPA threshold', detail: '6 students under 2.0 GPA', state: 'due', stateLabel: 'Action', priority: 'high', priorityLabel: 'High' },
    { title: 'Missing assignments', detail: '4 classes with overdue work', state: 'progress', stateLabel: 'In review', priority: 'medium', priorityLabel: 'Med' },
    { title: 'Attendance risk', detail: '3 students near absence limit', state: 'ready', stateLabel: 'Noted', priority: 'low', priorityLabel: 'Low' }
  ];

  newEntryOpen = false;
  gradeEntry = {
    subject: this.subjects[0],
    term: this.terms[0],
    grade: this.grades[0],
    classSection: this.classes[0],
    type: this.assessmentTypes[0],
    dueDate: '',
    maxScore: 100,
    weight: 20,
    category: this.categories[0],
    locking: 'no',
    description: '',
    autoCalc: true,
    publish: false,
    allowLate: false
  };

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }

  get activeFilters(): string {
    const parts = [
      this.selectedTerm,
      this.selectedYear,
      this.selectedGrade ? `Grade ${this.selectedGrade.replace('Grade ', '')}` : 'All grades',
      this.selectedClass ? `Class ${this.selectedClass}` : 'All classes'
    ];
    return parts.join(' · ');
  }

  resetFilters() {
    this.selectedTerm = this.terms[0];
    this.selectedYear = this.years[0];
    this.selectedGrade = '';
    this.selectedClass = '';
  }

  openNewEntry() {
    this.newEntryOpen = true;
  }

  closeNewEntry() {
    this.newEntryOpen = false;
  }

  saveNewEntry() {
    this.newEntryOpen = false;
  }

  setRole(role: 'admin' | 'teacher') {
    this.userRole = role;
  }
  isAdmin() { return this.userRole === 'admin'; }
  isTeacher() { return this.userRole === 'teacher'; }
}
