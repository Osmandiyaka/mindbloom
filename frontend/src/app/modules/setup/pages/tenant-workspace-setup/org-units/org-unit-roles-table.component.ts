import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MbButtonComponent, MbTableActionsDirective, MbTableColumn, MbTableComponent, MbTableEmptyState } from '@mindbloom/ui';
import { OrgUnitRoleAssignmentDto } from '../../../../../core/services/org-unit-api.service';
import { OrgUnitStore } from './org-unit.store';

type OrgUnitRoleRow = {
    id: string;
    name: string;
    description: string;
    status: string;
    source: OrgUnitRoleAssignmentDto;
};

@Component({
    selector: 'app-org-unit-roles-table',
    standalone: true,
    imports: [CommonModule, MbTableComponent, MbTableActionsDirective, MbButtonComponent],
    templateUrl: './org-unit-roles-table.component.html',
    styleUrls: ['./org-unit-roles-table.component.scss'],
})
export class OrgUnitRolesTableComponent {
    private readonly store = inject(OrgUnitStore);
    private readonly router = inject(Router);

    private readonly orgUnitIdValue = signal<string | null>(null);
    private readonly searchTermValue = signal('');

    @Input() set orgUnitId(value: string | null) {
        this.orgUnitIdValue.set(value ?? null);
    }

    @Input() set searchTerm(value: string | null) {
        this.searchTermValue.set(value ?? '');
    }

    @Output() clearSearch = new EventEmitter<void>();
    @Output() assignRoles = new EventEmitter<void>();

    pageIndex = signal(1);
    private readonly rowsPerPage = 8;

    readonly isLoading = computed(() => this.store.rolesLoading());
    readonly isError = computed(() => !!this.store.rolesError());

    readonly roles = computed(() => {
        if (!this.orgUnitIdValue()) return [];
        return this.store.roles();
    });

    readonly filteredRows = computed<OrgUnitRoleRow[]>(() => {
        const query = this.searchTermValue().trim().toLowerCase();
        const rows = this.roles().map(role => ({
            id: role.roleId,
            name: role.role?.name ?? role.roleId,
            description: role.role?.description ?? '—',
            status: role.role?.status ?? 'active',
            source: role,
        }));
        if (!query) return rows;
        return rows.filter(row => {
            const haystack = `${row.name} ${row.description}`.toLowerCase();
            return haystack.includes(query);
        });
    });

    readonly pageCount = computed(() => {
        const total = this.filteredRows().length;
        return Math.max(1, Math.ceil(total / this.rowsPerPage));
    });

    readonly pagedRows = computed(() => {
        const page = Math.min(this.pageIndex(), this.pageCount());
        const start = (page - 1) * this.rowsPerPage;
        return this.filteredRows().slice(start, start + this.rowsPerPage);
    });

    readonly tableSummary = computed(() => {
        const total = this.filteredRows().length;
        if (!total) return 'No roles';
        const page = Math.min(this.pageIndex(), this.pageCount());
        const start = (page - 1) * this.rowsPerPage + 1;
        const end = Math.min(total, page * this.rowsPerPage);
        return `Showing ${start}-${end} of ${total} role${total === 1 ? '' : 's'}`;
    });

    readonly columns: MbTableColumn<OrgUnitRoleRow>[] = [
        {
            key: 'name',
            label: 'Role',
            width: '70%',
            cell: row => ({
                primary: row.name,
                secondary: row.description,
                tooltip: row.description !== '—' ? row.description : row.name,
            }),
        },
        {
            key: 'status',
            label: 'Status',
            width: '20%',
            cell: row => row.status,
        },
    ];

    readonly emptyState = computed<MbTableEmptyState>(() => {
        if (this.searchTermValue().trim()) {
            return {
                variant: 'filtered',
                title: 'No roles found',
                description: 'Try a different search term or clear the search.',
                actions: [{ id: 'clearSearch', label: 'Clear search', variant: 'primary' }],
            };
        }
        return {
            title: 'No roles assigned',
            description: 'Assign roles to control access for this unit.',
            actions: [{ id: 'assignRoles', label: 'Assign roles', variant: 'primary' }],
        };
    });

    readonly isFiltered = computed(() => !!this.searchTermValue().trim());

    constructor() {
        effect(() => {
            const id = this.orgUnitIdValue();
            const selected = this.store.selectedOrgUnitId();
            if (id && id !== selected) {
                this.store.selectOrgUnit(id);
            }
            this.pageIndex.set(1);
        }, { allowSignalWrites: true });

        effect(() => {
            this.searchTermValue();
            this.pageIndex.set(1);
        }, { allowSignalWrites: true });

        effect(() => {
            const pageCount = this.pageCount();
            if (this.pageIndex() > pageCount) {
                this.pageIndex.set(pageCount);
            }
        }, { allowSignalWrites: true });
    }

    rowKey = (row: OrgUnitRoleRow) => row.id;

    prevPage(): void {
        const next = Math.max(1, this.pageIndex() - 1);
        this.pageIndex.set(next);
    }

    nextPage(): void {
        const next = Math.min(this.pageCount(), this.pageIndex() + 1);
        this.pageIndex.set(next);
    }

    handleEmptyAction(action: string): void {
        if (action === 'clearSearch') {
            this.clearSearch.emit();
            return;
        }
        if (action === 'assignRoles') {
            this.assignRoles.emit();
        }
    }

    handleCellClick(event: { row: OrgUnitRoleRow; column: MbTableColumn<OrgUnitRoleRow> }): void {
        if (String(event.column.key) !== 'name') return;
        const query = event.row.name || event.row.id;
        this.router.navigate(['/roles'], {
            queryParams: { roleSearch: query },
        });
    }

    confirmRemove(row: OrgUnitRoleRow): void {
        const label = row.name || 'this role';
        if (!window.confirm(`Remove ${label} from this unit?`)) return;
        this.store.removeRole(row.id);
    }
}
