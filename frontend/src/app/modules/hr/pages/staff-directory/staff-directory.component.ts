import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  MbAlertComponent,
  MbButtonComponent,
  MbCardComponent,
  MbCheckboxComponent,
  MbInlineComponent,
  MbPopoverComponent,
  MbSelectComponent,
  MbStackComponent,
  MbTableActionsDirective,
  MbTableColumn,
  MbTableComponent,
  MbTableEmptyState,
  MbSelectOption,
} from '@mindbloom/ui';
import { HrService, Staff } from '../../../../core/services/hr.service';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { PageHeaderComponent } from '../../../../core/ui/page-header/page-header.component';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OverlayModule,
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbCheckboxComponent,
    MbInlineComponent,
    MbPopoverComponent,
    MbSelectComponent,
    MbStackComponent,
    MbTableActionsDirective,
    MbTableComponent,
    SearchInputComponent,
    PageHeaderComponent,
  ],
  templateUrl: './staff-directory.component.html',
  styleUrls: ['./staff-directory.component.scss']
})
export class StaffDirectoryComponent implements OnInit {
  filters = { status: '', search: '' };
  loading = false;
  error: string | null = null;
  selectedIds = new Set<string>();
  pageSize = 10;
  pageIndex = 1;
  toast: string | null = null;
  exportMenuOpen = false;
  columnsMenuOpen = false;
  density: 'comfortable' | 'compact' = 'comfortable';
  hiddenColumns: string[] = [];
  searchValue = '';
  openRowMenuId: string | null = null;
  readonly onRetry = () => this.reload();

  statusOptions: MbSelectOption[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Archived', value: 'archived' },
  ];

  rowsPerPageOptions: MbSelectOption[] = [
    { label: '10 rows', value: '10' },
    { label: '25 rows', value: '25' },
    { label: '50 rows', value: '50' },
  ];

  staffTableColumns: MbTableColumn<Staff>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      cell: row => ({
        primary: this.displayName(row) || '—',
        secondary: row.primarySchoolId ? 'School linked' : 'No school assigned',
        icon: { symbol: this.initials(row), title: this.displayName(row) || 'Staff' },
      }),
    },
    {
      key: 'staffCode',
      label: 'Staff code',
      sortable: true,
      cell: row => row.staffCode || '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      cell: row => this.statusLabel(row.status),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      cell: row => this.formatUpdatedAt(row.updatedAt),
    },
  ];

  rowKey = (row: Staff) => row.id || row._id || '';
  rowClass = (_row: Staff) => '';

  constructor(
    public hr: HrService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.applyQueryParams();
    this.reload();
  }

  get hasActiveFilters() {
    return !!(this.filters.status || this.filters.search);
  }

  get staffList(): Staff[] {
    return this.hr.staff().filter(s => {
      const statusFilter = this.filters.status;
      const matchesStatus = !statusFilter
        || (statusFilter === 'inactive'
          ? !['active', 'archived'].includes(s.status || '')
          : s.status === statusFilter);
      const term = this.filters.search.toLowerCase();
      const matchesSearch = !term ||
        (`${s.firstName || ''} ${s.lastName || ''}`).toLowerCase().includes(term) ||
        (s.preferredName || '').toLowerCase().includes(term) ||
        (s.staffCode || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  get pagedStaff(): Staff[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.staffList.slice(start, start + this.pageSize);
  }

  get pageCount() {
    return Math.max(1, Math.ceil(this.staffList.length / this.pageSize));
  }

  get totalStaff() {
    return this.hr.staff().length;
  }

  get activeCount() {
    return this.hr.staff().filter(s => s.status === 'active').length;
  }

  get archivedCount() {
    return this.hr.staff().filter(s => s.status === 'archived').length;
  }

  get inactiveCount() {
    return this.hr.staff().filter(s => !['active', 'archived'].includes(s.status || '')).length;
  }

  get showSummary() {
    return !this.loading && this.totalStaff > 0;
  }

  get helperText() {
    if (this.loading) return '';
    if (this.totalStaff === 0) return 'Showing 0 of 0 staff';
    return `Showing ${this.staffList.length} of ${this.totalStaff} staff`;
  }

  get isNoResults() {
    return !this.loading && this.hasActiveFilters && this.staffList.length === 0;
  }

  get tableEmptyState(): MbTableEmptyState | undefined {
    if (this.error) {
      return undefined;
    }
    if (this.isNoResults) {
      return {
        variant: 'filtered',
        title: 'No results found',
        description: 'Try adjusting your search or clearing filters.',
        actions: [
          { id: 'clearFilters', label: 'Clear filters', variant: 'primary' },
          { id: 'resetSearch', label: 'Reset search', variant: 'secondary' },
        ],
      };
    }
    return {
      variant: 'default',
      title: 'No staff members yet',
      description: 'Add your first staff member to start managing HR profiles and assignments.',
      actions: [
        { id: 'addStaff', label: 'Add staff', variant: 'primary' },
        { id: 'importCsv', label: 'Import CSV', variant: 'secondary' },
        { id: 'learnMore', label: 'Learn more', variant: 'tertiary' },
      ],
    };
  }

  get summaryItems() {
    const items = [`Total staff: ${this.totalStaff}`];
    if (this.activeCount > 0) items.push(`Active: ${this.activeCount}`);
    if (this.inactiveCount > 0) items.push(`Inactive: ${this.inactiveCount}`);
    return items;
  }

  get visibleColumns(): MbTableColumn<Staff>[] {
    return this.staffTableColumns.filter(col => !this.hiddenColumns.includes(String(col.key)));
  }

  reload() {
    this.loading = true;
    this.error = null;
    const statusFilter = this.filters.status === 'inactive' ? '' : this.filters.status;
    this.hr.loadStaff({
      status: statusFilter,
      search: this.filters.search
    });
    setTimeout(() => { this.loading = false; }, 800);
  }

  onSearch(term: string) {
    this.filters.search = term;
    this.searchValue = term;
    this.updateQueryParams({ q: term || null });
    this.pageIndex = 1;
    this.reload();
  }

  clearFilters() {
    this.filters = { status: '', search: '' };
    this.searchValue = '';
    this.selectedIds = new Set();
    this.updateQueryParams({ status: null, q: null });
    this.pageIndex = 1;
    this.reload();
  }

  initials(staff: Staff) {
    const name = this.displayName(staff);
    return (name || '?').slice(0, 2).toUpperCase();
  }

  displayName(staff: Staff) {
    const first = staff.preferredName || staff.firstName || '';
    const last = staff.lastName || '';
    return `${first} ${last}`.trim();
  }

  viewProfile(staff: Staff) {
    const id = staff.id || (staff as any)._id;
    if (id) {
      this.router.navigate(['/hr/profile', id]);
    }
  }

  onStatusChange(value: string) {
    this.filters.status = value;
    this.updateQueryParams({ status: value || null });
    this.pageIndex = 1;
    this.reload();
  }

  onDensityChange(mode: 'comfortable' | 'compact') {
    this.density = mode;
    this.updateQueryParams({ density: mode });
  }

  toggleColumn(key: string) {
    if (this.hiddenColumns.includes(key)) {
      this.hiddenColumns = this.hiddenColumns.filter(item => item !== key);
    } else {
      this.hiddenColumns = [...this.hiddenColumns, key];
    }
    const visible = this.staffTableColumns
      .map(col => String(col.key))
      .filter(colKey => !this.hiddenColumns.includes(colKey));
    const allKeys = this.staffTableColumns.map(c => String(c.key));
    const isDefault = visible.length === allKeys.length;
    this.updateQueryParams({ columns: isDefault ? null : visible.join(',') });
  }

  columnKey(column: MbTableColumn<Staff>) {
    return String(column.key);
  }

  isColumnVisible(column: MbTableColumn<Staff>) {
    return !this.hiddenColumns.includes(this.columnKey(column));
  }

  resetSearch() {
    if (!this.filters.search) return;
    this.filters.search = '';
    this.searchValue = '';
    this.updateQueryParams({ q: null });
    this.pageIndex = 1;
    this.reload();
  }

  toggleRowMenu(event: Event, staff: Staff) {
    event.stopPropagation();
    const id = staff.id || (staff as any)._id || '';
    this.openRowMenuId = this.openRowMenuId === id ? null : id;
  }

  closeRowMenu() {
    this.openRowMenuId = null;
  }

  closeExportMenu() {
    this.exportMenuOpen = false;
  }

  closeColumnsMenu() {
    this.columnsMenuOpen = false;
  }

  statusToggleLabel(staff: Staff) {
    return staff.status === 'active' ? 'Deactivate' : 'Activate';
  }

  onExportAction(action: string) {
    this.exportMenuOpen = false;
    this.notify(`${action} export queued (placeholder).`);
  }

  onEmptyAction(actionId: string) {
    switch (actionId) {
      case 'addStaff':
        this.openAdd();
        break;
      case 'importCsv':
        this.notify('Import flow coming soon.');
        break;
      case 'learnMore':
        this.notify('Learn more coming soon.');
        break;
      case 'clearFilters':
        this.clearFilters();
        break;
      case 'resetSearch':
        this.resetSearch();
        break;
      default:
        break;
    }
  }

  openAdd() {
    alert('Add staff form coming soon.');
  }

  notify(message: string) {
    this.toast = message;
    setTimeout(() => this.toast = null, 1500);
  }

  private applyQueryParams() {
    const params = this.route.snapshot.queryParamMap;
    const search = params.get('q') || '';
    const status = params.get('status') || '';
    const density = params.get('density');
    const columns = params.get('columns');

    this.filters.search = search;
    this.searchValue = search;
    this.filters.status = status;
    this.density = density === 'compact' ? 'compact' : 'comfortable';
    this.hiddenColumns = this.parseHiddenColumns(columns);
  }

  private parseHiddenColumns(columnsParam: string | null) {
    if (!columnsParam) return [];
    const visible = new Set(columnsParam.split(',').map(v => v.trim()).filter(Boolean));
    return this.staffTableColumns.map(c => String(c.key)).filter(key => !visible.has(key));
  }

  private updateQueryParams(params: { [key: string]: string | null }) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  formatUpdatedAt(value?: string) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  }

  statusLabel(status?: Staff['status']) {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'onLeave':
        return 'On leave';
      case 'suspended':
        return 'Suspended';
      case 'archived':
        return 'Archived';
      case 'terminated':
        return 'Terminated';
      default:
        return 'Inactive';
    }
  }

  onSelectionChange(rows: Staff[]) {
    this.selectedIds = new Set(rows.map(row => row.id || row._id || '').filter(Boolean));
  }

  changePageSize(value: string) {
    this.pageSize = Number(value);
    this.pageIndex = 1;
  }

  nextPage() {
    if (this.pageIndex < this.pageCount) {
      this.pageIndex += 1;
    }
  }

  prevPage() {
    if (this.pageIndex > 1) {
      this.pageIndex -= 1;
    }
  }
}
