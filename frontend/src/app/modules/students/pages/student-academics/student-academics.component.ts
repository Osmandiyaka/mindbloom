import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-academics',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-academics.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Academics</h1>
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

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Gradebook status</h3>
          </div>
          <ul class="list">
            <li>Math (Grade 6) — due Friday</li>
            <li>Science (Grade 7) — 40% posted</li>
            <li>English (Grade 5) — draft entries</li>
          </ul>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Report card queue</h3>
          </div>
          <ul class="list">
            <li>Term 1 — proofing</li>
            <li>Term 2 — templates ready</li>
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

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }
}
