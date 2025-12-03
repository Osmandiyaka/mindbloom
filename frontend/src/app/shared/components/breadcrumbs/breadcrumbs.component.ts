import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconRegistryService } from '../../services/icon-registry.service';

export interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li class="crumb">
          <a [routerLink]="'/'">
            <span class="icon" [innerHTML]="icon('dashboard')"></span>
          </a>
        </li>
        <li class="separator">/</li>
        <li *ngFor="let c of items; let last = last" class="crumb">
          <ng-container *ngIf="c.link && !last; else lastItem">
            <a [routerLink]="c.link">{{ c.label }}</a>
          </ng-container>
          <ng-template #lastItem>
            <span class="current">{{ c.label }}</span>
          </ng-template>
          <span class="separator" *ngIf="!last">/</span>
        </li>
      </ol>
    </nav>
  `,
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  @Input() items: Crumb[] = [];

  constructor(private icons: IconRegistryService) {}

  icon(name: string) {
    return this.icons.icon(name);
  }
}
