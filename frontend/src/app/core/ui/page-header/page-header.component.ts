import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'host-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="text">
        <h1>
          <a *ngIf="titleLink" class="title-link" [href]="titleLink" target="_blank" rel="noopener noreferrer">{{ title }} <span class="ext">↗</span></a>
          <span *ngIf="!titleLink">{{ title }}</span>
        </h1>
        <p class="description" *ngIf="description">{{ description }}</p>
      </div>

      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 12px;
    }

    .text { min-width: 0; }

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      line-height: 1.1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .description {
      margin: 4px 0 0;
      color: var(--text-primary, #111827);
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .title-link {
      color: var(--link-color, #0b1220);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }
    .title-link:hover { text-decoration: underline; }
    .title-link .ext { font-size: 12px; opacity: .6; }

  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() titleLink?: string | null;
}
