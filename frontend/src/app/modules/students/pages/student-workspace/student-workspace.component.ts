import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';

@Component({
  selector: 'app-student-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent],
  styleUrls: ['./student-workspace.component.scss'],
  template: `
    <div class="workspace">
      <header class="hero">
        <div>
          <p class="eyebrow">Student Workspace</p>
          <h1>Students & Lifecycle</h1>
          <p class="muted">
            Central hub for roster, admissions, attendance, academics, conduct, and reports.
          </p>
          <div class="hero-actions">
            <app-button variant="primary" size="sm" routerLink="/students/roster">
              <span class="icon" [innerHTML]="icon('students')"></span>
              Open Roster
            </app-button>
            <app-button variant="secondary" size="sm" routerLink="/students/new">
              <span class="icon" [innerHTML]="icon('student-add')"></span>
              Add Student
            </app-button>
            <app-button variant="ghost" size="sm" routerLink="/students/admissions">
              Admissions pipeline
            </app-button>
          </div>
        </div>
      </header>

      <section class="tiles">
        <article class="tile">
          <div class="tile-top">
            <div class="chip ontrack">On track</div>
            <span class="icon" [innerHTML]="icon('students')"></span>
          </div>
          <p class="label">Active students</p>
          <p class="value">482</p>
          <p class="muted small">Roster health across grades</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip watch">Watch</div>
            <span class="icon" [innerHTML]="icon('admissions')"></span>
          </div>
          <p class="label">Admissions in flight</p>
          <p class="value">38</p>
          <p class="muted small">Interviews & offers this term</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip open">Today</div>
            <span class="icon" [innerHTML]="icon('attendance')"></span>
          </div>
          <p class="label">Attendance</p>
          <p class="value">96%</p>
          <p class="muted small">4 sections below 90%</p>
        </article>
        <article class="tile">
          <div class="tile-top">
            <div class="chip action">Action</div>
            <span class="icon" [innerHTML]="icon('reports')"></span>
          </div>
          <p class="label">Academic alerts</p>
          <p class="value">12</p>
          <p class="muted small">Low-score follow-ups</p>
        </article>
      </section>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Quick links</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/students/dashboard"><span [innerHTML]="icon('dashboard')"></span> Dashboard</a>
            <a routerLink="/students/roster"><span [innerHTML]="icon('students')"></span> Roster</a>
            <a routerLink="/students/admissions"><span [innerHTML]="icon('admissions')"></span> Admissions</a>
            <a routerLink="/students/attendance"><span [innerHTML]="icon('attendance')"></span> Attendance</a>
            <a routerLink="/students/academics"><span [innerHTML]="icon('academics')"></span> Academics</a>
            <a routerLink="/students/conduct"><span [innerHTML]="icon('tasks')"></span> Conduct</a>
            <a routerLink="/students/reports"><span [innerHTML]="icon('reports')"></span> Reports</a>
          </div>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>My tasks</h3>
          </div>
          <ul class="task-list">
            <li><span class="pill open">Open</span> Verify Grade 6B attendance</li>
            <li><span class="pill watch">Watch</span> Prepare term report cards</li>
            <li><span class="pill action">Action</span> Parent follow-up: conduct incident</li>
          </ul>
        </app-card>
      </section>
    </div>
  `
})
export class StudentWorkspaceComponent {
  constructor(private icons: IconRegistryService) {}

  icon(name: string) {
    return this.icons.icon(name);
  }
}
