import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { StudentsListComponent } from '../students-list/students-list.component';

@Component({
  selector: 'app-student-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, StudentsListComponent],
  styleUrls: ['./student-workspace.component.scss'],
  template: `
    <div class="workspace">
      <div class="columns">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>Quick Links</h3>
          </div>
          <ul class="links">
            <li><a routerLink="/students/roster"><span class="icon" [innerHTML]="icon('students')"></span> Roster</a></li>
            <li><a routerLink="/students/admissions"><span class="icon" [innerHTML]="icon('admissions')"></span> Admissions</a></li>
            <li><a routerLink="/students/attendance"><span class="icon" [innerHTML]="icon('attendance')"></span> Attendance</a></li>
            <li><a routerLink="/students/academics"><span class="icon" [innerHTML]="icon('academics')"></span> Academics</a></li>
            <li><a routerLink="/students/conduct"><span class="icon" [innerHTML]="icon('tasks')"></span> Conduct</a></li>
            <li><a routerLink="/students/reports"><span class="icon" [innerHTML]="icon('reports')"></span> Reports</a></li>
          </ul>
        </aside>

        <main class="content">
          <header class="hero">
            <div>
              <p class="eyebrow">Student Workspace</p>
              <h1>Students & Lifecycle</h1>
              <p class="muted">
                Central hub for roster, admissions, attendance, academics, conduct, and reports.
              </p>
            </div>
            <div class="hero-actions">
              <a routerLink="/students/roster" class="link-cta primary">
                <span class="icon" [innerHTML]="icon('students')"></span>
                Open Roster
              </a>
              <a routerLink="/students/new" class="link-cta">
                <span class="icon" [innerHTML]="icon('student-add')"></span>
                Add Student
              </a>
              <a routerLink="/students/admissions" class="link-cta subtle">
                Admissions pipeline
              </a>
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
                <h3>My tasks</h3>
              </div>
              <ul class="task-list">
                <li><span class="pill open">Open</span> Verify Grade 6B attendance</li>
                <li><span class="pill watch">Watch</span> Prepare term report cards</li>
                <li><span class="pill action">Action</span> Parent follow-up: conduct incident</li>
              </ul>
            </app-card>
          </section>

          <section class="roster-section">
            <app-students-list></app-students-list>
          </section>
        </main>
      </div>
    </div>
  `
})
export class StudentWorkspaceComponent {
  constructor(private icons: IconRegistryService) { }

  icon(name: string) {
    return this.icons.icon(name);
  }
}
