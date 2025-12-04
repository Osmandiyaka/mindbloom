import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus, Gender } from '../../../../core/models/student.model';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent, BadgeComponent, BreadcrumbsComponent, SearchInputComponent, ModalComponent, StudentFormComponent],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-page">
      @if (showBreadcrumbs) {
        <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>
      }

      <div class="toolbar">
        <div class="toolbar-left">
          <div><h2>Students</h2></div>
          <app-search-input placeholder="Search students..." (search)="onSearch($event)"></app-search-input>
          <select [(ngModel)]="gradeFilter" (change)="applyFilters()">
            <option value="">All grades</option>
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">All status</option>
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
          <select [(ngModel)]="genderFilter" (change)="applyFilters()">
            <option value="">All genders</option>
            <option *ngFor="let g of genders" [value]="g">{{ g }}</option>
          </select>
        </div>
        <div class="toolbar-right">
          <div class="view-toggle" role="group" aria-label="View switch">
            <button [class.active]="viewMode() === 'table'" (click)="setView('table')" title="Table view">
              <span class="icon" [innerHTML]="icon('inbox')"></span>
            </button>
            <button [class.active]="viewMode() === 'grid'" (click)="setView('grid')" title="Grid view">
              <span class="icon" [innerHTML]="icon('dashboard')"></span>
            </button>
          </div>
          <app-button variant="secondary" size="sm" (click)="exportStudents()">
            <span class="icon" [innerHTML]="icon('download')"></span> Export
          </app-button>
          <app-button variant="secondary" size="sm" (click)="importStudents()">
            <span class="icon" [innerHTML]="icon('upload')"></span> Import
          </app-button>
          <app-button variant="primary" size="sm" (click)="openModal()">
            <span class="icon" [innerHTML]="icon('student-add')"></span> Add Student
          </app-button>
          <button class="btn-ghost" title="Bulk actions placeholder" disabled>Bulk actions (coming soon)</button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading students...</p>
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
        <ng-container [ngSwitch]="viewMode()">
          <div *ngSwitchCase="'table'" class="data-table">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width:48px;"><input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll($event)"/></th>
                    <th class="sortable">Student</th>
                    <th>Class</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of filteredStudents()" class="row-clickable" [routerLink]="['/students', student.id]">
                    <td><input type="checkbox" [checked]="isSelected(student.id)" (click)="toggleSelect($event, student.id)"/></td>
                    <td class="col-primary student-cell">
                      <div class="student-meta">
                        <span class="student-id">{{ student.enrollment.admissionNumber }}</span>
                        <div class="student-name">
                          <span class="avatar">{{ initials(student.fullName) }}</span>
                          <span class="name">{{ student.fullName }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ student.enrollment.class }}{{ student.enrollment.section ? '-' + student.enrollment.section : '' }}</td>
                    <td>{{ student.email || 'N/A' }}</td>
                    <td>
                      <app-badge [variant]="student.status === 'active' ? 'success' : 'neutral'" size="sm">
                        {{ student.status }}
                      </app-badge>
                    </td>
                    <td>
                      <div class="cell-actions">
                        <button (click)="editStudent($event, student.id)" title="Edit"><span class="icon" [innerHTML]="icon('edit')"></span></button>
                        <button (click)="deleteStudent($event, student)" title="Delete"><span class="icon" [innerHTML]="icon('trash')"></span></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div *ngSwitchCase="'grid'" class="card-grid">
            <div class="student-card" *ngFor="let student of filteredStudents()">
              <div class="card-header">
                <div class="avatar">{{ student.fullName.charAt(0) }}</div>
                <div>
                  <div class="name">{{ student.fullName }}</div>
                  <div class="muted small email">{{ student.email || 'N/A' }}</div>
                </div>
                <app-badge [variant]="student.status === 'active' ? 'success' : 'neutral'" size="sm">
                  {{ student.status }}
                </app-badge>
              </div>
              <div class="card-meta">
                <span>Adm: {{ student.enrollment.admissionNumber }}</span>
                <span>Class: {{ student.enrollment.class }}{{ student.enrollment.section ? '-' + student.enrollment.section : '' }}</span>
              </div>
              <div class="divider"></div>
              <div class="card-actions">
                <button (click)="viewStudent($event, student.id)"><span class="icon" [innerHTML]="icon('eye')"></span></button>
                <button (click)="editStudent($event, student.id)"><span class="icon" [innerHTML]="icon('edit')"></span></button>
                <button (click)="deleteStudent($event, student)"><span class="icon" [innerHTML]="icon('trash')"></span></button>
              </div>
            </div>
          </div>
        </ng-container>
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
  viewMode = signal<'table' | 'grid'>('table');
  gradeFilter = '';
  statusFilter: StudentStatus | '' = '';
  genderFilter = '';
  grades: string[] = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  statuses: StudentStatus[] = [
    StudentStatus.ACTIVE,
    StudentStatus.INACTIVE,
    StudentStatus.SUSPENDED,
    StudentStatus.GRADUATED,
    StudentStatus.TRANSFERRED,
    StudentStatus.WITHDRAWN
  ];
  genders: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];
  selectedIds = signal<Set<string>>(new Set());
  modalOpen = signal(false);
  crumbs: Crumb[] = [
    { label: 'Students', link: '/students' },
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

  viewStudent(event: Event, id: string): void {
    event.stopPropagation();
    this.router.navigate(['/students', id]);
  }

  setView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  icon(name: string) {
    return this.icons.icon(name);
  }

  applyFilters() {
    // No-op; filters are applied via getter
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
      const matchesStatus = !this.statusFilter || s.status === this.statusFilter;
      const matchesGender = !this.genderFilter || (s as any).gender === this.genderFilter;
      return matchesTerm && matchesGrade && matchesStatus && matchesGender;
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
