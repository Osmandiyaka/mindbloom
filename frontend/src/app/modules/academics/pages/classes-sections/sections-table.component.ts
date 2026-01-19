import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { MbButtonComponent, MbPopoverComponent, MbTableActionsDirective, MbTableColumn, MbTableComponent, MbTableEmptyState } from '@mindbloom/ui';
import { SectionDto } from '../../../../core/services/academics-api.service';

export type SectionTableRow = {
    id: string;
    name: string;
    code?: string | null;
    schoolName?: string;
    capacity?: number | null;
    status: 'active' | 'archived';
    updatedAt?: string;
    source: SectionDto;
};

@Component({
    selector: 'app-sections-table',
    standalone: true,
    imports: [CommonModule, MbTableComponent, MbTableActionsDirective, MbButtonComponent, MbPopoverComponent],
    templateUrl: './sections-table.component.html',
    styleUrls: ['./sections-table.component.scss'],
})
export class SectionsTableComponent {
    @Input() rows: SectionDto[] = [];
    @Input() schoolNames = new Map<string, string>();
    @Input() isLoading = false;
    @Input() isError = false;
    @Input() isFiltered = false;

    @Output() view = new EventEmitter<SectionDto>();
    @Output() edit = new EventEmitter<SectionDto>();
    @Output() archive = new EventEmitter<SectionDto>();
    @Output() restore = new EventEmitter<SectionDto>();
    @Output() emptyAction = new EventEmitter<string>();

    menuOpenId = signal<string | null>(null);

    readonly tableRows = computed<SectionTableRow[]>(() => this.rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code ?? null,
        schoolName: this.schoolNames.get(row.schoolId) ?? '-',
        capacity: row.capacity ?? null,
        status: row.status,
        updatedAt: row.updatedAt,
        source: row,
    })));

    readonly columns: MbTableColumn<SectionTableRow>[] = [
        {
            key: 'name',
            label: 'Section',
            width: '32%',
            cell: row => ({
                primary: row.name,
                secondary: row.code || undefined,
                tooltip: row.code || undefined,
            }),
        },
        {
            key: 'schoolName',
            label: 'School',
            width: '20%',
            cell: row => row.schoolName || '-',
        },
        {
            key: 'capacity',
            label: 'Capacity',
            width: '16%',
            cell: row => row.capacity != null ? String(row.capacity) : '-',
        },
        {
            key: 'status',
            label: 'Status',
            width: '16%',
            cell: row => row.status === 'active' ? 'Active' : 'Archived',
        },
        {
            key: 'updatedAt',
            label: 'Updated',
            width: '16%',
            cell: row => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-',
        },
    ];

    readonly emptyState = computed<MbTableEmptyState>(() => {
        if (this.isFiltered) {
            return {
                variant: 'filtered',
                title: 'No sections found',
                description: 'Try a different search term or clear the filters.',
                actions: [{ id: 'clearFilters', label: 'Clear filters', variant: 'primary' }],
            };
        }
        return {
            title: 'No sections yet',
            description: 'Create a section to start enrolling students.',
            actions: [{ id: 'addSection', label: 'Add section', variant: 'primary' }],
        };
    });

    rowKey = (row: SectionTableRow) => row.id;

    toggleMenu(rowId: string): void {
        this.menuOpenId.set(this.menuOpenId() === rowId ? null : rowId);
    }

    closeMenu(): void {
        this.menuOpenId.set(null);
    }

    handleEmptyAction(actionId: string): void {
        this.emptyAction.emit(actionId);
    }

    handleView(row: SectionTableRow): void {
        this.view.emit(row.source);
    }

    handleEdit(row: SectionTableRow): void {
        this.edit.emit(row.source);
        this.closeMenu();
    }

    handleArchive(row: SectionTableRow): void {
        if (row.status === 'active') {
            this.archive.emit(row.source);
        } else {
            this.restore.emit(row.source);
        }
        this.closeMenu();
    }
}
