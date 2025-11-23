import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus } from '../../../../core/models/student.model';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <div class="students-page">
      <!-- Hero Section -->
      <app-hero
        title="Students"
        subtitle="Manage student profiles, records, and academic information"
        image="assets/illustrations/students.svg"
        [showActions]="true">
        <div actions>
          <app-button variant="primary" (click)="addNewStudent()">
            + Add New Student
          </app-button>
        </div>
      </app-hero>

      <!-- Table Toolbar -->
      <div class="table-toolbar mt-6">
        <div class="toolbar-left">
          <div class="search-input">
            <input
              type="search"
              class="form-control"
              placeholder="Search students..."
              (input)="onSearchChange($event)"
            />
          </div>
        </div>
        <div class="toolbar-right">
          <app-button variant="secondary" size="sm" (click)="exportStudents()">
            Export
          </app-button>
          <app-button variant="primary" size="sm" (click)="importStudents()">
            Import
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

      <!-- Data Table -->
      @if (!loading() && !error() && students().length > 0) {
      <div class="data-table">
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
                    <button (click)="editStudent($event, student.id)" title="Edit">✏️</button>
                    <button (click)="deleteStudent($event, student)" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <div class="table-info">Showing {{ students().length }} student(s)</div>
          <div class="table-pagination">
            <button disabled>Previous</button>
            <button class="active">1</button>
            <button>Next</button>
          </div>
        </div>
      </div>
      }
    </div>
  `
})
export class StudentsListComponent implements OnInit {
  students = signal<Student[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';

  constructor(
    private router: Router,
    private studentService: StudentService
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
}
