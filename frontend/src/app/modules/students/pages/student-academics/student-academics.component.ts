import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-academics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-academics.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="muted">Grade entry, report cards, and GPA summaries.</p>
        </div>
        <div class="actions">
          <app-button variant="secondary" size="sm">Download report</app-button>
          <app-button variant="primary" size="sm">
            <span class="icon" [innerHTML]="icon('academics')"></span>
            New Grade Entry
          </app-button>
        </div>
      </header>

      <section class="scope-bar">
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
        </div>
        <div class="kpi accent">
          <span class="eyebrow">Posted entries</span>
          <p class="value">{{ metrics.posted }}%</p>
          <small class="muted">Across selected scope</small>
        </div>
        <div class="kpi">
          <span class="eyebrow">Report cards in queue</span>
          <p class="value">{{ metrics.reportQueue }}</p>
          <small class="muted">Proofing/ready</small>
        </div>
        <div class="kpi">
          <span class="eyebrow">GPA avg</span>
          <p class="value">{{ metrics.gpaAvg }}</p>
          <small class="muted">Range {{ metrics.gpaMin }} - {{ metrics.gpaMax }}</small>
          <div class="mini-spark">
            <span class="spark-bar h60"></span>
            <span class="spark-bar h70"></span>
            <span class="spark-bar h65"></span>
            <span class="spark-bar h75"></span>
            <span class="spark-bar h72"></span>
          </div>
        </div>
        <div class="kpi alarm pulse">
          <span class="eyebrow">Alerts</span>
          <p class="value">{{ metrics.alerts }}</p>
          <small class="muted">Overdue items</small>
        </div>
        <div class="kpi alarm">
          <span class="eyebrow">Failing students</span>
          <p class="value">{{ metrics.failing }}</p>
          <small class="muted">Need intervention</small>
        </div>
        <div class="kpi accent">
          <span class="eyebrow">Top performers</span>
          <p class="value">{{ metrics.topPerformers }}</p>
          <small class="muted">GPA &gt; 4.0</small>
        </div>
      </section>

      <section class="analytics-grid">
        <app-card class="dist-card">
          <div class="card-header">
            <h3 class="themed-heading">GPA Distribution</h3>
            <p class="muted small">Current scope</p>
          </div>
          <div class="bars">
            <div class="bar"><span>0-1</span></div>
            <div class="bar"><span>1-2</span></div>
            <div class="bar mid"><span>2-3</span></div>
            <div class="bar high"><span>3-3.5</span></div>
            <div class="bar top"><span>3.5-4.0</span></div>
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
              <span class="status-pill" [ngClass]="item.state">{{ item.stateLabel }}</span>
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
    gpaMin: 2.8,
    gpaMax: 3.9,
    alerts: 3,
    failing: 4,
    topPerformers: 9
  };

  gradebookStatus = [
    { subject: 'Mathematics · Grade 6', meta: 'Due Friday · Quiz 3', state: 'due', stateLabel: 'Due', icon: 'book' },
    { subject: 'Science · Grade 7', meta: '40% posted · Lab report', state: 'progress', stateLabel: 'Posting', icon: 'science' },
    { subject: 'English · Grade 5', meta: 'Draft entries · Essay', state: 'draft', stateLabel: 'Draft', icon: 'edit' }
  ];

  interventions = [
    { title: 'Students below GPA threshold', detail: '6 students under 2.0 GPA', state: 'due', stateLabel: 'Action' },
    { title: 'Missing assignments', detail: '4 classes with overdue work', state: 'progress', stateLabel: 'In review' },
    { title: 'Attendance risk', detail: '3 students near absence limit', state: 'ready', stateLabel: 'Noted' }
  ];

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }
}
