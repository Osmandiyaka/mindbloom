import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MbButtonComponent, MbTableActionsDirective, MbTableColumn, MbTableComponent, MbTableEmptyState } from '@mindbloom/ui';
import { OrgUnitMemberDto } from '../../../../../core/services/org-unit-api.service';
import { OrgUnitStore } from './org-unit.store';

type OrgUnitMemberRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    source: OrgUnitMemberDto;
};

@Component({
    selector: 'app-org-unit-members-table',
    standalone: true,
    imports: [CommonModule, MbTableComponent, MbTableActionsDirective, MbButtonComponent],
    templateUrl: './org-unit-members-table.component.html',
    styleUrls: ['./org-unit-members-table.component.scss'],
})
export class OrgUnitMembersTableComponent {
    private readonly store = inject(OrgUnitStore);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    private readonly orgUnitIdValue = signal<string | null>(null);
    private readonly searchTermValue = signal('');

    @Input() set orgUnitId(value: string | null) {
        this.orgUnitIdValue.set(value ?? null);
    }

    @Input() set searchTerm(value: string | null) {
        this.searchTermValue.set(value ?? '');
    }

    @Output() clearSearch = new EventEmitter<void>();
    @Output() addMembers = new EventEmitter<void>();

    pageIndex = signal(1);
    private readonly rowsPerPage = 8;

    readonly isLoading = computed(() => this.store.membersLoading());
    readonly isError = computed(() => !!this.store.membersError());

    readonly members = computed(() => {
        if (!this.orgUnitIdValue()) return [];
        return this.store.members();
    });

    readonly filteredRows = computed<OrgUnitMemberRow[]>(() => {
        const query = this.searchTermValue().trim().toLowerCase();
        const rows = this.members().map(member => ({
            id: member.userId,
            name: member.name || member.email || '—',
            email: member.email,
            role: member.roleInUnit || '—',
            status: member.status || 'active',
            source: member,
        }));
        if (!query) return rows;
        return rows.filter(row => {
            const haystack = `${row.name} ${row.email} ${row.role}`.toLowerCase();
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
        if (!total) return 'No members';
        const page = Math.min(this.pageIndex(), this.pageCount());
        const start = (page - 1) * this.rowsPerPage + 1;
        const end = Math.min(total, page * this.rowsPerPage);
        return `Showing ${start}-${end} of ${total} member${total === 1 ? '' : 's'}`;
    });

    readonly columns: MbTableColumn<OrgUnitMemberRow>[] = [
        {
            key: 'name',
            label: 'Name',
            width: '70%',
            cell: row => ({
                primary: row.name,
                secondary: row.email,
                tooltip: row.email,
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
                title: 'No members found',
                description: 'Try a different search term or clear the search.',
                actions: [{ id: 'clearSearch', label: 'Clear search', variant: 'primary' }],
            };
        }
        return {
            title: 'No members assigned',
            description: 'Assign members to control access for this unit.',
            actions: [{ id: 'addMembers', label: 'Add members', variant: 'primary' }],
        };
    });

    readonly isFiltered = computed(() => !!this.searchTermValue().trim());

    constructor() {
        effect(() => {
            this.orgUnitIdValue();
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

    rowKey = (row: OrgUnitMemberRow) => row.id;

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
        if (action === 'addMembers') {
            this.addMembers.emit();
        }
    }

    handleCellClick(event: { row: OrgUnitMemberRow; column: MbTableColumn<OrgUnitMemberRow> }): void {
        if (String(event.column.key) !== 'name') return;
        const query = event.row.email || event.row.name;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                step: 2,
                userSearch: query,
            },
            queryParamsHandling: 'merge',
        });
    }

    confirmRemove(row: OrgUnitMemberRow): void {
        const label = row.name || row.email || 'this member';
        if (!window.confirm(`Remove ${label} from this unit?`)) return;
        this.store.removeMember(row.id);
    }
}
