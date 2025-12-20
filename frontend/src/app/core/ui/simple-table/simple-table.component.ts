import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../shared/ui/buttons/ui-button.component';
import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';

export interface SimpleColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'host-simple-table',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  template: `
    <table class="table">
      <thead>
        <tr>
          <th *ngFor="let c of columns" [ngClass]="{ 'right': c.align === 'right' }">{{ c.label }}</th>
          <th class="right">Actions</th>
        </tr>
      </thead>

      <tbody>
        <ng-container *ngFor="let r of data; trackBy: trackById">
          <tr (click)="onRowClick(r)">
            <td *ngFor="let c of columns" [ngClass]="{ 'right': c.align === 'right' }">
              <ng-container *ngIf="!cellTemplates?.[c.key]">{{ resolve(r, c.key) }}</ng-container>
              <ng-container *ngIf="cellTemplates?.[c.key] as fn">{{ fn(r) }}</ng-container>
            </td>
            <td class="right">
              <ng-container *ngIf="actionTemplate">
                <ng-container *ngTemplateOutlet="actionTemplate; context: { row: r }"></ng-container>
              </ng-container>
              <ng-container *ngIf="!actionTemplate">
                <ui-button size="sm" (click)="$event.stopPropagation(); onView(r)">View</ui-button>
              </ng-container>
            </td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  `,
  styles: [`
    .table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.45; color: #111827; }
    th, td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: top; }
    th { font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; background: rgba(15,23,42,0.02); }
    td { color: #111827; font-size: 14px; }
    .right { text-align: right; }
    tbody tr:hover { background: var(--host-surface-muted); }
    .btn { border: 1px solid var(--host-border-subtle); background: transparent; padding: 10px 12px; border-radius: 10px; cursor: pointer; color: var(--host-text-color); }
    .btn.small { padding: 7px 10px; border-radius: 10px; font-size: 13px; }
  `]
})
export class SimpleTableComponent {
  @Input() columns: SimpleColumn[] = [];
  @Input() data: any[] = [];
  @Input() idKey = 'id';
  // optional map of cell renderers by key
  @Input() cellTemplates?: { [key: string]: (row: any) => string } | null = null;

  @ContentChild('actionTemplate') actionTemplate?: TemplateRef<any>;

  @Output() rowClick = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();

  trackById = (_: number, item: any) => item?.[this.idKey];

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  onView(row: any) {
    this.view.emit(row);
  }

  resolve(row: any, key: string) {
    return key.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), row) ?? '';
  }
}
