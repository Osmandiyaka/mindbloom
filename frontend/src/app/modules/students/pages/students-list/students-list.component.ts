import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent, BadgeComponent, BreadcrumbsComponent, DataTableComponent, ModalComponent, StudentFormComponent],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-page">
      @if (showBreadcrumbs) {
        <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state" role="status" aria-live="polite">
          <div class="spinner"></div>
          <p>Loading students...</p>
          <div class="skeleton-stack">
            <div class="skeleton-row" *ngFor="let _ of [1,2,3,4,5]">
              <span class="skeleton-avatar"></span>
              <span class="skeleton-line short"></span>
              <span class="skeleton-line"></span>
              <span class="skeleton-pill"></span>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <app-button variant="primary" (click)="loadStudents()">Retry</app-button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && filteredStudents().length === 0) {
        <div class="empty-state">
          <h3>No students found</h3>
          <p>Get started by adding your first student</p>
          <app-button variant="primary" (click)="openModal()">
            + Add New Student
          </app-button>
        </div>
      }

      @if (!loading() && !error() && filteredStudents().length > 0) {
        <app-data-table
          [columns]="columns"
          [data]="filteredStudents()"
          [pageSizeOptions]="[10, 25, 50]"
          [pageSize]="pageSize"
          [searchableKeys]="['fullName', 'enrollment.admissionNumber', 'email']"
          searchPlaceholder="Search students..."
          (searchChange)="onSearch($event)"
          (rowClick)="viewStudent(null, $event.id)"
          (pageChange)="onPage($event)"
          (sortChange)="onSort($event)"
        >
          <ng-container table-filters>
            <select [(ngModel)]="gradeFilter" (change)="applyFilters()">
              <option value="">All grades</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
            <div class="actions-menu" [class.open]="actionsOpen">
              <app-button variant="secondary" size="sm" (click)="toggleActions()" aria-label="Open actions menu">
                <span class="icon" [innerHTML]="icon('ellipsis')"></span>
                Actions
                <span class="chevron">▾</span>
              </app-button>
              <div class="menu" *ngIf="actionsOpen">
                <button type="button" (click)="exportAndClose()">
                  <span class="icon" [innerHTML]="icon('download')"></span>
                  Export
                </button>
                <button type="button" (click)="importAndClose()">
                  <span class="icon" [innerHTML]="icon('upload')"></span>
                  Import
                </button>
              </div>
            </div>
            <app-button variant="primary" size="sm" (click)="openModal()">
              <span class="icon" [innerHTML]="icon('student-add')"></span> Add Student
            </app-button>
          </ng-container>

          <ng-template #rowTemplate let-student>
            <tr class="row-clickable" [routerLink]="['/students', student.id]">
              <td>
                <input type="checkbox" [checked]="isSelected(student.id)" (click)="toggleSelect($event, student.id)"/>
              </td>
              <td class="col-primary student-cell">
                <div class="student-meta">
                  <div class="avatar-wrap" aria-hidden="true">
                    <span class="avatar">{{ initials(student.fullName) }}</span>
                  </div>
                  <div class="student-name-block">
                    <span class="name">{{ student.fullName }}</span>
                    <span class="student-id">ID · {{ student.enrollment.admissionNumber }}</span>
                  </div>
                </div>
              </td>
              <td>{{ student.enrollment.class }}{{ student.enrollment.section ? '-' + student.enrollment.section : '' }}</td>
              <td>{{ student.email || 'N/A' }}</td>
              <td>
                <div class="cell-actions">
                  <button (click)="editStudent($event, student.id)" title="Edit"><span class="icon" [innerHTML]="icon('edit')"></span></button>
                  <button (click)="deleteStudent($event, student)" title="Delete"><span class="icon" [innerHTML]="icon('trash')"></span></button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptyState>
            <div class="empty-state">No students found.</div>
          </ng-template>
        </app-data-table>
      }
    </div>

    <app-modal [isOpen]="modalOpen()" (closed)="closeModal()" title="Add Student" size="xl">
      <app-student-form (submitted)="onModalSubmit()" (cancelled)="closeModal()"></app-student-form>
    </app-modal>
  `
})
export class StudentsListComponent implements OnInit {
  @Input() showBreadcrumbs = true;
  allStudents = signal<Student[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';
  gradeFilter = '';
  actionsOpen = false;
  pageSize = 10;
  columns: TableColumn[] = [
    { key: 'select', label: '', width: '52px' },
    { key: 'student', label: 'Student', sortable: true },
    { key: 'class', label: 'Class', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'actions', label: 'Actions', width: '120px' }
  ];
  grades: string[] = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  selectedIds = signal<Set<string>>(new Set());
  modalOpen = signal(false);
  crumbs: Crumb[] = [
    { label: 'Roster' }
  ];

  constructor(
    private router: Router,
    private studentService: StudentService,
    private icons: IconRegistryService
  ) { }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.searchTerm ? { search: this.searchTerm } : {};

    this.studentService.getStudents(filters).subscribe({
      next: (students: Student[]) => {
        this.allStudents.set(students);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading students:', err);
        this.error.set('Failed to load students. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFilters();
  }

  openModal(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onModalSubmit(): void {
    this.closeModal();
    this.loadStudents();
  }

  editStudent(event: Event, id: string): void {
    event.stopPropagation();
    this.router.navigate(['/students', id, 'edit']);
  }

  deleteStudent(event: Event, student: Student): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (err: any) => {
          alert('Failed to delete student');
          console.error('Error deleting student:', err);
        }
      });
    }
  }

  importStudents(): void {
    this.router.navigate(['/students/import']);
  }

  importAndClose(): void {
    this.actionsOpen = false;
    this.importStudents();
  }

  exportStudents(): void {
    const filters = this.searchTerm ? { search: this.searchTerm } : {};

    this.studentService.exportStudents(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        alert('Failed to export students');
        console.error('Error exporting students:', err);
      }
    });
  }

  exportAndClose(): void {
    this.actionsOpen = false;
    this.exportStudents();
  }

  viewStudent(event: Event | null, id: string): void {
    if (event) { event.stopPropagation(); }
    this.router.navigate(['/students', id]);
  }

  toggleActions() {
    this.actionsOpen = !this.actionsOpen;
  }

  icon(name: string) {
    return this.icons.icon(name);
  }

  applyFilters() {
    // No-op; filters are applied via getter
  }

  onPage(evt: { pageIndex: number; pageSize: number }) {
    this.pageSize = evt.pageSize;
  }

  onSort(evt: { key: string; direction: 'asc' | 'desc' }) {
    // Client-side sort handled by table; reserved for server-side integration.
  }

  filteredStudents(): Student[] {
    const term = this.searchTerm.toLowerCase().trim();
    return this.allStudents().filter(s => {
      const matchesTerm =
        !term ||
        s.fullName.toLowerCase().includes(term) ||
        s.enrollment.admissionNumber.toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term);
      const matchesGrade = !this.gradeFilter || s.enrollment.class?.toLowerCase().startsWith(this.gradeFilter.toLowerCase());
      return matchesTerm && matchesGrade;
    });
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleSelect(event: Event, id: string) {
    event.stopPropagation();
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds.set(next);
  }

  isSelected(id: string) {
    return this.selectedIds().has(id);
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(new Set(this.filteredStudents().map(s => s.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  allSelected() {
    const filtered = this.filteredStudents();
    return filtered.length > 0 && filtered.every(s => this.selectedIds().has(s.id));
  }
}
