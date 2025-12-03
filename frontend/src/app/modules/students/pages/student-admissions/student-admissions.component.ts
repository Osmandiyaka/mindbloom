import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-admissions',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-admissions.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Admissions</h1>
          <p class="muted">Track applicants through each stage and convert to enrolled students.</p>
        </div>
        <div class="actions">
          <app-button variant="primary" size="sm">
            <span class="icon" [innerHTML]="icon('admissions')"></span>
            New Applicant
          </app-button>
        </div>
      </header>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Pipeline</h3>
          </div>
          <ul class="list">
            <li>Submitted: 24</li>
            <li>Interviews scheduled: 8</li>
            <li>Offers sent: 5</li>
          </ul>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Quick actions</h3>
          </div>
          <div class="quick-actions">
            <app-button variant="secondary" size="sm">Schedule interview</app-button>
            <app-button variant="secondary" size="sm">Extend offer</app-button>
            <app-button variant="secondary" size="sm">Import applicants</app-button>
          </div>
        </app-card>
      </section>
    </div>
  `
})
export class StudentAdmissionsComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Admissions' }
  ];

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }
}
