import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-conduct',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, CardComponent, ButtonComponent],
  styleUrls: ['./student-conduct.component.scss'],
  template: `
    <div class="page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <header class="page-header">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Conduct & Discipline</h1>
          <p class="muted">Log incidents, actions taken, and notify guardians.</p>
        </div>
        <div class="actions">
          <app-button variant="primary" size="sm">
            <span class="icon" [innerHTML]="icon('tasks')"></span>
            Log Incident
          </app-button>
        </div>
      </header>

      <section class="grid">
        <app-card>
          <div class="card-header">
            <h3>Recent incidents</h3>
          </div>
          <ul class="list">
            <li>Late arrival — Grade 6B</li>
            <li>Uniform violation — Grade 5A</li>
            <li>Class disruption — Grade 7C</li>
          </ul>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3>Open actions</h3>
          </div>
          <ul class="list">
            <li>2 pending parent notifications</li>
            <li>1 suspension review</li>
          </ul>
        </app-card>
      </section>
    </div>
  `
})
export class StudentConductComponent {
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
    { label: 'Conduct' }
  ];

  constructor(private icons: IconRegistryService) {}
  icon(name: string) { return this.icons.icon(name); }
}
