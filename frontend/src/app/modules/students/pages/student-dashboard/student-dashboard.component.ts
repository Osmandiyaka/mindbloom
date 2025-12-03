import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-dashboard.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Student Dashboard</h1>
          <p class="muted">At-a-glance roster health, admissions pipeline, attendance, and academics.</p>
        </div>
        <div class="actions">
          <app-button variant="secondary" size="sm" routerLink="/students">Open Roster</app-button>
          <app-button variant="primary" size="sm" routerLink="/students/new">
            <span class="icon" [innerHTML]="icon('student-add')"></span>
            Add Student
          </app-button>
        </div>
      </header>

      <section class="tiles">
        <article class="tile">
          <div class="tile-top">
            <div class="chip ontrack">On track</div>
            <span class="icon" [innerHTML]="icon('students')"></span>
          </div>
          <p class="label">Active Students</p>
          <p class="value">482</p>
          <p class="muted small">Roster by grade and gender</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip watch">Watch</div>
            <span class="icon" [innerHTML]="icon('admissions')"></span>
          </div>
          <p class="label">Admissions</p>
          <p class="value">38</p>
          <p class="muted small">In pipeline this term</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip action">Action</div>
            <span class="icon" [innerHTML]="icon('attendance')"></span>
          </div>
          <p class="label">Attendance today</p>
          <p class="value">96%</p>
          <p class="muted small">4 classes below 90%</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip open">Open</div>
            <span class="icon" [innerHTML]="icon('reports')"></span>
          </div>
          <p class="label">Academic alerts</p>
          <p class="value">12</p>
          <p class="muted small">Low scores flagged</p>
        </article>
      </section>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Quick Links</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/students" class="quick-link"><span [innerHTML]="icon('students')"></span> Roster</a>
            <a routerLink="/students/admissions" class="quick-link"><span [innerHTML]="icon('admissions')"></span> Admissions</a>
            <a routerLink="/students/attendance" class="quick-link"><span [innerHTML]="icon('attendance')"></span> Attendance</a>
            <a routerLink="/students/academics" class="quick-link"><span [innerHTML]="icon('academics')"></span> Academics</a>
            <a routerLink="/students/conduct" class="quick-link"><span [innerHTML]="icon('tasks')"></span> Conduct</a>
            <a routerLink="/students/reports" class="quick-link"><span [innerHTML]="icon('reports')"></span> Reports</a>
          </div>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Admissions snapshot</h3>
          </div>
          <div class="snapshot">
            <div class="stat">
              <p class="label">Submitted</p>
              <p class="value">24</p>
            </div>
            <div class="stat">
              <p class="label">Interviews</p>
              <p class="value">8</p>
            </div>
            <div class="stat">
              <p class="label">Offers</p>
              <p class="value">5</p>
            </div>
            <div class="stat">
              <p class="label">Enrolled</p>
              <p class="value">3</p>
            </div>
          </div>
        </app-card>
      </section>
    </div>
  `
})
export class StudentDashboardComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Dashboard' }
  ];

  constructor(private icons: IconRegistryService) {}

  icon(name: string) {
    return this.icons.icon(name);
  }
}
