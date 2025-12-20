import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'host-page-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div class="text">
        <h1>{{ title }}</h1>
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
      color: var(--text-secondary, #6b7280);
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  `],
})
export class PageHeaderComponent {
    @Input({ required: true }) title!: string;
    @Input() description?: string;
}
