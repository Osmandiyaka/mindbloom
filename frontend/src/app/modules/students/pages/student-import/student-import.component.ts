import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';

interface ImportError {
    row: number;
    field: string;
    message: string;
}

interface ImportResult {
    total: number;
    successful: number;
    failed: number;
    errors: ImportError[];
    students?: Student[];
}

@Component({
    selector: 'app-student-import',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './student-import.component.html',
    styleUrls: ['./student-import.component.scss']
})
export class StudentImportComponent {
    file = signal<File | null>(null);
    fileName = signal<string>('');
    importing = signal(false);
    validating = signal(false);
    importResult = signal<ImportResult | null>(null);
    validationErrors = signal<ImportError[]>([]);
    previewData = signal<any[]>([]);
    step = signal<'upload' | 'validate' | 'review' | 'complete'>('upload');

    constructor(
        private studentService: StudentService,
        private router: Router
    ) { }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const selectedFile = input.files[0];

            // Validate file type
            if (!this.isValidFileType(selectedFile)) {
                alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
                return;
            }

            // Validate file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }

            this.file.set(selectedFile);
            this.fileName.set(selectedFile.name);
            this.step.set('upload');
        }
    }

    isValidFileType(file: File): boolean {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        return validTypes.includes(file.type) ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls');
    }

    validateFile(): void {
        const currentFile = this.file();
        if (!currentFile) return;

        this.validating.set(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const rows = this.parseCSV(content);

            if (rows.length < 2) {
                alert('The file must contain at least a header row and one data row');
                this.validating.set(false);
                return;
            }

            const errors = this.validateData(rows);
            this.validationErrors.set(errors);

            if (errors.length === 0) {
                this.previewData.set(rows.slice(1, 6)); // Show first 5 rows
                this.step.set('review');
            } else {
                this.step.set('validate');
            }

            this.validating.set(false);
        };

        reader.onerror = () => {
            alert('Error reading file');
            this.validating.set(false);
        };

        reader.readAsText(currentFile);
    }

    parseCSV(content: string): string[][] {
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => {
            // Simple CSV parser (handles basic cases)
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            values.push(current.trim());
            return values;
        });
    }

    validateData(rows: string[][]): ImportError[] {
        const errors: ImportError[] = [];
        const headers = rows[0];

        // Required columns
        const requiredColumns = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'admissionNumber'];
        const missingColumns = requiredColumns.filter(col =>
            !headers.some(h => h.toLowerCase() === col.toLowerCase())
        );

        if (missingColumns.length > 0) {
            errors.push({
                row: 0,
                field: 'headers',
                message: `Missing required columns: ${missingColumns.join(', ')}`
            });
            return errors;
        }

        // Validate each data row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            // Check if row has data
            if (row.every(cell => !cell || cell.trim() === '')) continue;

            // Validate required fields
            requiredColumns.forEach((col, idx) => {
                const colIndex = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
                if (colIndex >= 0 && (!row[colIndex] || row[colIndex].trim() === '')) {
                    errors.push({
                        row: i + 1,
                        field: col,
                        message: `${col} is required`
                    });
                }
            });

            // Validate email format
            const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
            if (emailIndex >= 0 && row[emailIndex] && row[emailIndex].trim()) {
                const email = row[emailIndex].trim();
                if (!this.isValidEmail(email)) {
                    errors.push({
                        row: i + 1,
                        field: 'email',
                        message: 'Invalid email format'
                    });
                }
            }

            // Validate date format
            const dobIndex = headers.findIndex(h => h.toLowerCase() === 'dateofbirth');
            if (dobIndex >= 0 && row[dobIndex]) {
                const date = new Date(row[dobIndex]);
                if (isNaN(date.getTime())) {
                    errors.push({
                        row: i + 1,
                        field: 'dateOfBirth',
                        message: 'Invalid date format (use YYYY-MM-DD)'
                    });
                }
            }
        }

        return errors;
    }

    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    importStudents(): void {
        const currentFile = this.file();
        if (!currentFile) return;

        this.importing.set(true);
        const formData = new FormData();
        formData.append('file', currentFile);

        this.studentService.importStudents(formData).subscribe({
            next: (result) => {
                this.importResult.set(result);
                this.step.set('complete');
                this.importing.set(false);
            },
            error: (err) => {
                alert('Failed to import students. Please try again.');
                console.error('Import error:', err);
                this.importing.set(false);
            }
        });
    }

    downloadTemplate(): void {
        const headers = [
            'firstName', 'lastName', 'middleName', 'dateOfBirth', 'gender',
            'email', 'phone', 'nationality', 'religion',
            'street', 'city', 'state', 'postalCode', 'country',
            'admissionNumber', 'admissionDate', 'academicYear', 'class', 'section',
            'guardianName', 'guardianRelationship', 'guardianPhone', 'guardianEmail'
        ];

        const sampleData = [
            'John', 'Doe', 'Michael', '2010-05-15', 'male',
            'john.doe@example.com', '+1234567890', 'American', 'Christian',
            '123 Main St', 'New York', 'NY', '10001', 'USA',
            'ADM2024001', '2024-01-15', '2024-2025', 'Grade 8', 'A',
            'Jane Doe', 'mother', '+1234567891', 'jane.doe@example.com'
        ];

        const csvContent = [
            headers.join(','),
            sampleData.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'student_import_template.csv';
        link.click();
        window.URL.revokeObjectURL(url);
    }

    reset(): void {
        this.file.set(null);
        this.fileName.set('');
        this.importResult.set(null);
        this.validationErrors.set([]);
        this.previewData.set([]);
        this.step.set('upload');
    }

    backToList(): void {
        this.router.navigate(['/students']);
    }
}
