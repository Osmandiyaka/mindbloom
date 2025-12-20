import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UiTableColumn { key: string; label: string; }

@Component({
    selector: 'ui-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <table class="ui-table">
      <thead><tr><th *ngFor="let c of columns">{{c.label}}</th><th class="right">Actions</th></tr></thead>
      <tbody>
        <ng-container *ngFor="let r of data">
          <tr (click)="rowClick.emit(r)">
            <td *ngFor="let c of columns">{{ resolve(r, c.key) }}</td>
            <td class="right"><button class="ui-btn small" (click)="$event.stopPropagation(); view.emit(r)">View</button></td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  `,
    styles: [`
    .ui-table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid var(--color-border); text-align: left; }
    .right { text-align: right; }
    .ui-btn.small { padding: 6px 8px; }
  `]
})
export class UiTableComponent {
    @Input() columns: UiTableColumn[] = [];
    @Input() data: any[] = [];
    @Output() rowClick = new EventEmitter<any>();
    @Output() view = new EventEmitter<any>();

    resolve(row: any, key: string) { return key.split('.').reduce((acc: any, p) => acc ? acc[p] : undefined, row) ?? ''; }
}
