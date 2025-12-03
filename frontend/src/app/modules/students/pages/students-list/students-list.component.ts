import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus } from '../../../../core/models/student.model';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent, BadgeComponent, BreadcrumbsComponent],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-page">
      <app-breadcrumbs [items]="crumbs"></app-breadcrumbs>

      <div class="toolbar">
        <div class="toolbar-left">
          <div>
            <h2>Students</h2>
          </div>
          <div class="search-input">
            <input
              type="search"
              class="form-control"
              placeholder="Search"
              (input)="onSearchChange($event)"
            />
          </div>
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
          <app-button variant="primary" size="sm" (click)="addNewStudent()">
            <span class="icon" [innerHTML]="icon('student-add')"></span> Add Student
          </app-button>
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
      @if (!loading() && !error() && students().length === 0) {
        <div class="empty-state">
          <h3>No students found</h3>
          <p>Get started by adding your first student</p>
          <app-button variant="primary" (click)="addNewStudent()">
            + Add New Student
          </app-button>
        </div>
      }

      @if (!loading() && !error() && students().length > 0) {
        <ng-container [ngSwitch]="viewMode()">
          <div *ngSwitchCase="'table'" class="data-table">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th class="sortable">Student ID</th>
                    <th class="sortable">Name</th>
                    <th>Class</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of students()" class="row-clickable" [routerLink]="['/students', student.id]">
                    <td class="col-primary">{{ student.enrollment.admissionNumber }}</td>
                    <td class="col-primary">{{ student.fullName }}</td>
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
            <div class="student-card" *ngFor="let student of students()">
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
                <button (click)="viewStudent($event, student.id)">View</button>
                <button (click)="editStudent($event, student.id)">Edit</button>
                <button (click)="deleteStudent($event, student)">Delete</button>
              </div>
            </div>
          </div>
        </ng-container>
      }
    </div>
  `
})
export class StudentsListComponent implements OnInit {
  students = signal<Student[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';
  viewMode = signal<'table' | 'grid'>('table');
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
        console.log('Loaded students from API:', students);
        this.students.set(students);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading students:', err);
        this.error.set('Failed to load students. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    // Debounce the search
    setTimeout(() => {
      if (this.searchTerm === target.value) {
        this.loadStudents();
      }
    }, 300);
  }

  addNewStudent(): void {
    this.router.navigate(['/students/new']);
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
}
