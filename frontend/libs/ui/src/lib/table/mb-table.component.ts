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
    cell?: (row: T) => string;
}

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
                    <tr *ngFor="let row of displayRows; trackBy: trackByKey">
                        <td *ngIf="selectable" class="mb-table__checkbox">
                            <input
                                type="checkbox"
                                [checked]="isSelected(row)"
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
                                [class.mb-table__cell--status]="isStatusColumn(column)"
                                [class.is-inactive]="isStatusColumn(column) && isInactiveStatus(row)"
                            >
                                {{ getCellValue(row, column) }}
                            </span>
                        </td>
                        <td *ngIf="actionsTemplate" class="mb-table__actions">
                            <ng-container *ngTemplateOutlet="actionsTemplate.template; context: { $implicit: row }"></ng-container>
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
    @Input() sortLocal = true;
    @Input() emptyMessage = 'No data available.';
    @Input() rowKey?: (row: T) => string;
    @Output() selectionChange = new EventEmitter<T[]>();
    @Output() sortChange = new EventEmitter<{ key: string; direction: MbSortDirection }>();

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
        const checked = (event.target as HTMLInputElement).checked;
        this.selectedKeys.clear();
        if (checked) {
            this.rows.forEach(row => this.selectedKeys.add(this.resolveKey(row)));
        }
        this.emitSelection();
    }

    toggleRow(row: T): void {
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

    getCellValue(row: T, column: MbTableColumn<T>): string {
        if (column.cell) {
            return column.cell(row);
        }
        const key = column.key as keyof T;
        const value = row[key];
        return value === undefined || value === null ? '' : String(value);
    }

    isStatusColumn(column: MbTableColumn<T>): boolean {
        return String(column.key) === 'status';
    }

    isInactiveStatus(row: T): boolean {
        return row['status' as keyof T] === 'Inactive';
    }
}
