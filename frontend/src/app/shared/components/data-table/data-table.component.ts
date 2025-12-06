import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { SearchInputComponent } from '../search-input/search-input.component';
import { MinValuePipe } from '../../pipes/min-value.pipe';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SearchInputComponent, MinValuePipe],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T = any> {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() pageSizeOptions = [10, 25, 50];
  @Input() pageSize = 10;
  @Input() enableSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() searchableKeys: string[] = [];
  @Input() title = '';
  @Input() enableNativeExport = true;
  @Input() defaultDensity: 'comfortable' | 'compact' = 'comfortable';

  @Output() sortChange = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() printRequest = new EventEmitter<void>();
  @Output() exportRequest = new EventEmitter<void>();

  @ContentChild('rowTemplate') rowTemplate?: TemplateRef<any>;
  @ContentChild('emptyState') emptyState?: TemplateRef<any>;

  searchTerm = '';
  sortKey: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  pageIndex = 0;
  dense = false;
  columnMenuOpen = false;
  hiddenColumns = new Set<string>();
  printCss = `
    * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d7dce5; padding: 8px 10px; text-align: left; }
    th { background: #f4f6fb; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
  `;

  get totalItems() {
    return this.processedData().length;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get visibleColumns(): TableColumn[] {
    return this.columns.filter(c => !this.hiddenColumns.has(c.key));
  }

  get pagedData(): T[] {
    const start = this.pageIndex * this.pageSize;
    return this.processedData().slice(start, start + this.pageSize);
  }

  onSearch(term: string) {
    this.searchTerm = term.trim();
    this.pageIndex = 0;
    this.searchChange.emit(this.searchTerm);
  }

  onSort(col: TableColumn) {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDirection = 'asc';
    }
    this.pageIndex = 0;
    this.sortChange.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  onPageSizeChange(size: number | string) {
    this.pageSize = Number(size);
    this.pageIndex = 0;
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  nextPage() {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    }
  }

  prevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    }
  }

  openPrint() {
    this.printRequest.emit();
    if (!this.enableNativeExport) return;
    const html = this.buildExportTable();
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${this.title || 'Table Export'}</title><style>${this.printCss}</style></head><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  exportToPdf() {
    this.exportRequest.emit();
    if (!this.enableNativeExport) return;
    this.openPrint();
  }

  processedData(): T[] {
    const filtered = this.applySearch(this.data);
    if (!this.sortKey) return filtered;
    const key = this.sortKey;
    const dir = this.sortDirection;
    return [...filtered].sort((a, b) => {
      const av = this.resolve(a, key);
      const bv = this.resolve(b, key);
      if (av == null && bv == null) return 0;
      if (av == null) return dir === 'asc' ? -1 : 1;
      if (bv == null) return dir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      return dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }

  toggleDensity() {
    this.dense = !this.dense;
  }

  toggleColumn(key: string) {
    const next = new Set(this.hiddenColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.hiddenColumns = next;
  }

  private applySearch(list: T[]): T[] {
    if (!this.searchTerm) return list;
    const keys = this.searchableKeys.length ? this.searchableKeys : this.columns.map(c => c.key);
    const term = this.searchTerm.toLowerCase();
    return list.filter(item =>
      keys.some(k => {
        const v = this.resolve(item, k);
        return v != null && String(v).toLowerCase().includes(term);
      })
    );
  }

  resolve(item: any, key: string) {
    return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), item);
  }

  private buildExportTable() {
    const header = this.columns.map(c => `<th>${c.label}</th>`).join('');
    const rows = this.processedData()
      .map(row => `<tr>${this.columns.map(c => `<td>${this.resolve(row, c.key) ?? ''}</td>`).join('')}</tr>`)
      .join('');
    return `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
  }
}
