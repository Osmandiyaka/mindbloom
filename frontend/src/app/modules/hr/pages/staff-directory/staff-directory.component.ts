import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HrService, Staff } from '../../../../core/services/hr.service';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, CardComponent, DataTableComponent],
  templateUrl: './staff-directory.component.html',
  styleUrls: ['./staff-directory.component.scss']
})
export class StaffDirectoryComponent implements OnInit {
  filters = { departmentCode: '', designationCode: '', status: '', search: '' };
  loading = false;
  error: string | null = null;
  selectedIds = new Set<string>();
  pageSize = 10;
  toast: string | null = null;

  columns: TableColumn[] = [
    { key: 'select', label: '', width: '48px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'designation', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', width: '120px' }
  ];

  constructor(public hr: HrService, private router: Router) {}

  ngOnInit(): void {
    this.reload();
  }

  get hasActiveFilters() {
    return !!(this.filters.departmentCode || this.filters.designationCode || this.filters.status || this.filters.search);
  }

  get staffList(): Staff[] {
    return this.hr.staff().filter(s => {
      const matchesDept = !this.filters.departmentCode || s.departmentCode === this.filters.departmentCode;
      const matchesDes = !this.filters.designationCode || s.designationCode === this.filters.designationCode;
      const matchesStatus = !this.filters.status || s.status === this.filters.status;
      const term = this.filters.search.toLowerCase();
      const matchesSearch = !term ||
        (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.employeeId || '').toLowerCase().includes(term);
      return matchesDept && matchesDes && matchesStatus && matchesSearch;
    });
  }

  reload() {
    this.loading = true;
    this.error = null;
    this.hr.loadStaff({
      departmentCode: this.filters.departmentCode,
      designationCode: this.filters.designationCode,
      status: this.filters.status,
      search: this.filters.search
    });
    setTimeout(() => { this.loading = false; }, 800);
  }

  onSearch(term: string) {
    this.filters.search = term;
    this.reload();
  }

  clearFilters() {
    this.filters = { departmentCode: '', designationCode: '', status: '', search: '' };
    this.selectedIds = new Set();
    this.reload();
  }

  toggleSelect(event: Event, id: string) {
    event.stopPropagation();
    const next = new Set(this.selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds = next;
  }

  allSelected() {
    const ids = this.staffList.map(s => s.id || (s as any)._id || '');
    return ids.length > 0 && ids.every(id => this.selectedIds.has(id));
  }

  initials(staff: Staff) {
    const name = (staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`).trim();
    return (name || '?').slice(0, 2).toUpperCase();
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds = new Set(this.staffList.map(s => s.id || (s as any)._id || ''));
    } else {
      this.selectedIds = new Set();
    }
  }

  viewProfile(staff: Staff) {
    const id = staff.id || (staff as any)._id;
    if (id) {
      this.router.navigate(['/hr/profile', id]);
    }
  }

  exportSelected() {
    alert(`Exporting ${this.selectedIds.size} records (placeholder).`);
  }

  openAdd() {
    alert('Add staff form coming soon.');
  }

  notify(message: string) {
    this.toast = message;
    setTimeout(() => this.toast = null, 1500);
  }
}
