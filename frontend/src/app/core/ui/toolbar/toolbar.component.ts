import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'host-toolbar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toolbar">
      <div class="filters">
        <ng-content />
      </div>

      <div class="actions">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
    styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-subtle, #e5e7eb);
      border-radius: 12px;
      margin-bottom: 16px;
      background: var(--surface-elevated, #fff);
    }

    .filters {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  `]
})
export class ToolbarComponent { }
