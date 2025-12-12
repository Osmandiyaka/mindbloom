import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { StudentsListComponent } from '../students-list/students-list.component';

@Component({
  selector: 'app-student-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent, StudentsListComponent],
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
