import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../../../../core/services/student.service';
import { Student, StudentFilters, StudentStatus } from '../../../../../core/models/student.model';

@Component({
    selector: 'app-student-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './student-list.component.html',
    styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
    students = signal<Student[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Filters
    searchTerm = signal('');
    selectedClass = signal<string | undefined>(undefined);
    selectedSection = signal<string | undefined>(undefined);
    selectedStatus = signal<string | undefined>(undefined);
    selectedGender = signal<string | undefined>(undefined);

    // View mode
    viewMode = signal<'table' | 'cards'>('table');

    // Computed
    filteredStudents = computed(() => {
        return this.students();
    });

    StudentStatus = StudentStatus;

    constructor(
        private studentService: StudentService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadStudents();
    }

    loadStudents(): void {
        console.log('Loading students...');
        this.loading.set(true);
        this.error.set(null);

        const filters: StudentFilters = {
            search: this.searchTerm() || undefined,
            class: this.selectedClass(),
            section: this.selectedSection(),
            status: this.selectedStatus(),
            gender: this.selectedGender(),
        };

        console.log('Calling API with filters:', filters);
        this.studentService.getStudents(filters).subscribe({
            next: (students: Student[]) => {
                console.log('Received students from API:', students.length, students);
                this.students.set(students);
                this.loading.set(false);
            },
            error: (err: any) => {
                console.error('Error loading students:', err);
                this.error.set('Failed to load students');
                this.loading.set(false);
            }
        });
    }

    onSearchChange(value: string): void {
        this.searchTerm.set(value);
        this.loadStudents();
    }

    onFilterChange(): void {
        this.loadStudents();
    }

    clearFilters(): void {
        this.searchTerm.set('');
        this.selectedClass.set(undefined);
        this.selectedSection.set(undefined);
        this.selectedStatus.set(undefined);
        this.selectedGender.set(undefined);
        this.loadStudents();
    }

    toggleViewMode(): void {
        this.viewMode.set(this.viewMode() === 'table' ? 'cards' : 'table');
    }

    createStudent(): void {
        this.router.navigate(['/students/new']);
    }

    viewStudent(id: string): void {
        this.router.navigate(['/students', id]);
    }

    editStudent(id: string): void {
        this.router.navigate(['/students', id, 'edit']);
    }

    deleteStudent(student: Student): void {
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

    getStatusBadgeClass(status: StudentStatus): string {
        const classes: Record<StudentStatus, string> = {
            [StudentStatus.ACTIVE]: 'badge-success',
            [StudentStatus.INACTIVE]: 'badge-secondary',
            [StudentStatus.GRADUATED]: 'badge-primary',
            [StudentStatus.TRANSFERRED]: 'badge-info',
            [StudentStatus.WITHDRAWN]: 'badge-warning',
            [StudentStatus.SUSPENDED]: 'badge-danger',
        };
        return classes[status] || 'badge-secondary';
    }

    getAge(dateOfBirth: Date): number {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString();
    }
}
