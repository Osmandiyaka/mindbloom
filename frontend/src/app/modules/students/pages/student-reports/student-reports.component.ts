import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-reports.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Reports</h1>
          <p class="muted">Roster exports, attendance trends, and academic summaries.</p>
        </div>
        <div class="actions">
          <app-button variant="secondary" size="sm">Export CSV</app-button>
          <app-button variant="primary" size="sm">
            <span class="icon" [innerHTML]="icon('reports')"></span>
            Open Report Center
          </app-button>
        </div>
      </header>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Key metrics</h3>
          </div>
          <ul class="list">
            <li>Total students: 482</li>
            <li>Average attendance: 95%</li>
            <li>At-risk academics: 12</li>
          </ul>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Exports</h3>
          </div>
          <ul class="list">
            <li>Roster by grade</li>
            <li>Contact sheet</li>
            <li>Attendance summary</li>
          </ul>
        </app-card>
      </section>
    </div>
  `
})
export class StudentReportsComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Reports' }
  ];

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }
}
