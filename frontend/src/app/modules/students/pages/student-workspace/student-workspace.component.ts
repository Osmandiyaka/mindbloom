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
      <div class="topbar">
        <nav class="breadcrumbs">
          <a routerLink="/students">Students</a>
          <span class="sep">/</span>
          <span>Workspace</span>
        </nav>
        <ul class="quick-inline">
          <li><a routerLink="/students/roster"><span class="icon" [innerHTML]="icon('students')"></span> Roster</a></li>
          <li><a routerLink="/students/admissions"><span class="icon" [innerHTML]="icon('admissions')"></span> Admissions</a></li>
          <li><a routerLink="/students/attendance"><span class="icon" [innerHTML]="icon('attendance')"></span> Attendance</a></li>
          <li><a routerLink="/students/academics"><span class="icon" [innerHTML]="icon('academics')"></span> Academics</a></li>
          <li><a routerLink="/students/conduct"><span class="icon" [innerHTML]="icon('tasks')"></span> Conduct</a></li>
          <li><a routerLink="/students/reports"><span class="icon" [innerHTML]="icon('reports')"></span> Reports</a></li>
        </ul>
      </div>

      <div class="columns main-grid">
        <section class="left-pane">
          <app-students-list [showBreadcrumbs]="false"></app-students-list>
        </section>

        <section class="right-pane">
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
                <div class="chip open">Today</div>
                <span class="icon" [innerHTML]="icon('attendance')"></span>
              </div>
              <p class="label">Attendance</p>
              <p class="value">96%</p>
              <p class="muted small">4 sections below 90%</p>
            </article>
            <article class="tile task-card">
              <h3 class="task-title">My tasks</h3>
              <ul class="task-list">
                <li><span class="pill open">Open</span> Verify Grade 6B attendance</li>
                <li><span class="pill watch">Watch</span> Prepare term report cards</li>
                <li><span class="pill action">Action</span> Parent follow-up: conduct incident</li>
              </ul>
            </article>
          </section>
        </section>
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
