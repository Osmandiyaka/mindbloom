import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output } from '@angular/core';
import { MbTableActionsDirective } from './mb-table-actions.directive';

export type MbSortDirection = 'asc' | 'desc';

export interface MbTableColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'start' | 'center' | 'end';
    cell?: (row: T) => MbTableCellValue;
}

export type MbTableCellValue =
    | string
    | {
          primary: string;
          secondary?: string;
          meta?: string;
          tertiary?: string;
          tooltip?: string;
          badges?: Array<{ label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }>;
          icon?: { symbol: string; title: string };
      };

@Component({
    selector: 'mb-table',
    standalone: true,
    imports: [CommonModule, MbTableActionsDirective],
    template: `
        <div class="mb-table">
            <table>
                <thead>
                    <tr>
                        <th *ngIf="selectable" class="mb-table__checkbox">
                            <input
                                type="checkbox"
                                [checked]="allSelected"
                                [indeterminate]="isIndeterminate"
                                [disabled]="selectionDisabled"
                                (change)="toggleAll($event)"
                                aria-label="Select all rows"
                            />
                        </th>
                        <th
                            *ngFor="let column of columns"
                            [style.width]="column.width || null"
                            [class.mb-table__sortable]="column.sortable"
                            [class.mb-table__sorted]="isSorted(column)"
                            [class.mb-table__align-center]="column.align === 'center'"
                            [class.mb-table__align-end]="column.align === 'end'"
                            (click)="toggleSort(column)"
                            [attr.aria-sort]="getAriaSort(column)"
                        >
                            <span>{{ column.label }}</span>
                            <span class="mb-table__sort-indicator" *ngIf="isSorted(column)">
                                {{ sortDirection === 'asc' ? '↑' : '↓' }}
                            </span>
                        </th>
                        <th *ngIf="actionsTemplate" class="mb-table__actions">Actions</th>
                    </tr>
                </thead>
                <tbody *ngIf="displayRows.length; else emptyState">
                    <tr
                        *ngFor="let row of displayRows; let rowIndex = index; trackBy: trackByKey"
                        [class]="rowClass?.(row) || null"
                        [attr.aria-selected]="selectable ? isSelected(row) : null"
                        (click)="handleRowClick($event, row)"
                        (keydown)="handleRowKeydown($event, row)"
                        tabindex="0"
                    >
                        <td *ngIf="selectable" class="mb-table__checkbox">
                            <input
                                type="checkbox"
                                [checked]="isSelected(row)"
                                [disabled]="selectionDisabled"
                                (change)="toggleRow(row)"
                                aria-label="Select row"
                            />
                        </td>
                        <td
                            *ngFor="let column of columns"
                            [class.mb-table__align-center]="column.align === 'center'"
                            [class.mb-table__align-end]="column.align === 'end'"
                        >
                            <span
                                class="mb-table__cell"
                                [attr.data-col]="getColumnKey(column)"
                                [class.mb-table__cell--status]="isStatusColumn(column)"
                                [class.mb-table__cell--link]="isNameColumn(column)"
                                [class.is-inactive]="isStatusColumn(column) && isInactiveStatus(row)"
                                [attr.title]="isStatusColumn(column) ? 'Enabled for assignment' : null"
                                (click)="handleCellClick($event, row, column)"
                            >
                                <ng-container *ngIf="getCellValue(row, column) as cell">
                                    <ng-container *ngIf="isCellObject(cell); else cellText">
                                        <span class="mb-table__cell-group">
                                            <span class="mb-table__cell-primary">
                                                <span
                                                    class="mb-table__cell-icon"
                                                    *ngIf="cell.icon"
                                                    [attr.title]="cell.icon.title"
                                                    aria-hidden="true"
                                                >
                                                    {{ cell.icon.symbol }}
                                                </span>
                                                <span class="mb-table__cell-text">{{ cell.primary }}</span>
                                                <span class="mb-table__cell-badges" *ngIf="cell.badges?.length">
                                                    <span
                                                        class="mb-table__badge"
                                                        *ngFor="let badge of cell.badges"
                                                        [class.mb-table__badge--success]="badge.tone === 'success'"
                                                        [class.mb-table__badge--warning]="badge.tone === 'warning'"
                                                        [class.mb-table__badge--danger]="badge.tone === 'danger'"
                                                    >
                                                        {{ badge.label }}
                                                    </span>
                                                </span>
                                            </span>
                                            <span class="mb-table__cell-secondary" *ngIf="cell.secondary">
                                                {{ cell.secondary }}
                                            </span>
                                            <span class="mb-table__cell-meta" *ngIf="cell.meta">
                                                {{ cell.meta }}
                                            </span>
                                            <span
                                                class="mb-table__cell-tertiary"
                                                *ngIf="cell.tertiary"
                                                [attr.title]="cell.tooltip || null"
                                            >
                                                {{ cell.tertiary }}
                                            </span>
                                        </span>
                                    </ng-container>
                                    <ng-template #cellText>{{ cell }}</ng-template>
                                </ng-container>
                            </span>
                        </td>
                        <td *ngIf="actionsTemplate" class="mb-table__actions">
                            <ng-container
                                *ngTemplateOutlet="actionsTemplate.template; context: { $implicit: row, rowIndex: rowIndex }"
                            ></ng-container>
                        </td>
                    </tr>
                </tbody>
            </table>
            <ng-template #emptyState>
                <div class="mb-table__empty">{{ emptyMessage }}</div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./mb-table.component.scss']
})
export class MbTableComponent<T extends Record<string, any>> {
    @Input() columns: MbTableColumn<T>[] = [];
    @Input() rows: T[] = [];
    @Input() selectable = false;
    @Input() selectionDisabled = false;
    @Input() sortLocal = true;
    @Input() emptyMessage = 'No data available.';
    @Input() rowKey?: (row: T) => string;
    @Input() rowClass?: (row: T) => string;
    @Output() selectionChange = new EventEmitter<T[]>();
    @Output() sortChange = new EventEmitter<{ key: string; direction: MbSortDirection }>();
    @Output() cellClick = new EventEmitter<{ row: T; column: MbTableColumn<T> }>();
    @Output() rowClick = new EventEmitter<T>();

    @ContentChild(MbTableActionsDirective) actionsTemplate?: MbTableActionsDirective;

    sortKey?: string;
    sortDirection: MbSortDirection = 'asc';
    selectedKeys = new Set<string>();

    get displayRows(): T[] {
        if (!this.sortLocal || !this.sortKey) {
            return this.rows;
        }
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        return [...this.rows].sort((a, b) => {
            const aValue = a[this.sortKey as keyof T];
            const bValue = b[this.sortKey as keyof T];
            if (aValue === bValue) {
                return 0;
            }
            return aValue > bValue ? direction : -direction;
        });
    }

    get allSelected(): boolean {
        return this.rows.length > 0 && this.rows.every(row => this.selectedKeys.has(this.resolveKey(row)));
    }

    get isIndeterminate(): boolean {
        return this.selectedKeys.size > 0 && !this.allSelected;
    }

    toggleSort(column: MbTableColumn<T>): void {
        if (!column.sortable) {
            return;
        }
        const key = String(column.key);
        if (this.sortKey === key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortKey = key;
            this.sortDirection = 'asc';
        }
        this.sortChange.emit({ key: this.sortKey, direction: this.sortDirection });
    }

    isSorted(column: MbTableColumn<T>): boolean {
        return this.sortKey === String(column.key);
    }

    getAriaSort(column: MbTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
        if (!column.sortable) {
            return null;
        }
        if (!this.isSorted(column)) {
            return 'none';
        }
        return this.sortDirection === 'asc' ? 'ascending' : 'descending';
    }

    toggleAll(event: Event): void {
        if (this.selectionDisabled) {
            return;
        }
        const checked = (event.target as HTMLInputElement).checked;
        this.selectedKeys.clear();
        if (checked) {
            this.rows.forEach(row => this.selectedKeys.add(this.resolveKey(row)));
        }
        this.emitSelection();
    }

    toggleRow(row: T): void {
        if (this.selectionDisabled) {
            return;
        }
        const key = this.resolveKey(row);
        if (this.selectedKeys.has(key)) {
            this.selectedKeys.delete(key);
        } else {
            this.selectedKeys.add(key);
        }
        this.emitSelection();
    }

    isSelected(row: T): boolean {
        return this.selectedKeys.has(this.resolveKey(row));
    }

    trackByKey = (_: number, row: T) => this.resolveKey(row);

    private emitSelection(): void {
        const selected = this.rows.filter(row => this.selectedKeys.has(this.resolveKey(row)));
        this.selectionChange.emit(selected);
    }

    private resolveKey(row: T): string {
        return this.rowKey ? this.rowKey(row) : JSON.stringify(row);
    }

    getCellValue(row: T, column: MbTableColumn<T>): MbTableCellValue {
        if (column.cell) {
            return column.cell(row);
        }
        const key = column.key as keyof T;
        const value = row[key];
        return value === undefined || value === null ? '' : String(value);
    }

    isCellObject(value: MbTableCellValue): value is { primary: string; secondary?: string } {
        return typeof value === 'object' && value !== null && 'primary' in value;
    }

    getColumnKey(column: MbTableColumn<T>): string {
        return String(column.key);
    }

    isStatusColumn(column: MbTableColumn<T>): boolean {
        return String(column.key) === 'status';
    }

    isInactiveStatus(row: T): boolean {
        const status = row['status' as keyof T];
        return status === 'Inactive'
            || status === 'Suspended'
            || status === 'Archived'
            || status === 'archived';
    }

    isNameColumn(column: MbTableColumn<T>): boolean {
        return String(column.key) === 'name';
    }

    handleCellClick(event: Event, row: T, column: MbTableColumn<T>): void {
        if (!this.isNameColumn(column)) return;
        event.stopPropagation();
        this.cellClick.emit({ row, column });
        if (this.rowClick.observed) {
            this.rowClick.emit(row);
        }
    }

    handleRowClick(event: Event, row: T): void {
        const target = event.target as HTMLElement | null;
        if (target && target.closest('button, a, input, [role="button"]')) {
            return;
        }
        this.rowClick.emit(row);
    }

    handleRowKeydown(event: KeyboardEvent, row: T): void {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        const target = event.target as HTMLElement | null;
        if (target && target.closest('button, a, input, [role=\"button\"]')) {
            return;
        }
        event.preventDefault();
        this.handleRowClick(event, row);
    }
}
