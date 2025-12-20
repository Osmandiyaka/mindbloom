import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'host-data-table-shell',
    standalone: true,
    imports: [CommonModule],
    template: `
    <ng-container *ngIf="loading; else notLoading">
      <div class="state loading">Loading…</div>
    </ng-container>

    <ng-template #notLoading>
      <div *ngIf="error" class="state error">{{ error }}</div>
      <div *ngIf="!error && !hasData" class="state empty">{{ emptyText }}</div>
      <ng-container *ngIf="!error && hasData">
        <ng-content />
      </ng-container>
    </ng-template>
  `,
    styles: [`
    .state {
      padding: 40px;
      text-align: center;
      color: var(--text-secondary, #6b7280);
    }

    .error { color: var(--danger, #dc2626); }
    .empty { color: var(--text-secondary, #6b7280); }
    .loading { color: var(--text-secondary, #6b7280); }
  `]
})
export class DataTableShellComponent {
    @Input() loading = false;
    @Input() error?: string | null;
    @Input() hasData = false;
    @Input() emptyText = 'No data';
}
