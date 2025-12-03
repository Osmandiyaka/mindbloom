import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-attendance.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Attendance</h1>
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

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Today’s snapshot</h3>
          </div>
          <div class="stats">
            <div>
              <p class="label">Present</p>
              <p class="value success">96%</p>
            </div>
            <div>
              <p class="label">Absent</p>
              <p class="value">3%</p>
            </div>
            <div>
              <p class="label">Late</p>
              <p class="value">1%</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Recent flags</h3>
          </div>
          <ul class="list">
            <li>Grade 6B below 90%</li>
            <li>3 students with 3+ absences this week</li>
            <li>2 pending excuses</li>
          </ul>
        </app-card>
      </section>
    </div>
  `
})
export class StudentAttendanceComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Attendance' }
  ];

  constructor(private icons: IconRegistryService) {}

  icon(name: string) {
    return this.icons.icon(name);
  }
}
