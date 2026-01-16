import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Student,
    CreateStudentDto,
    UpdateStudentDto,
    StudentFilters,
    StudentActivityItem,
    StudentFilterResponse,
    Guardian,
    GuardianRelationshipOption,
    Document,
    StudentAcademicSubject,
    StudentAcademicTerm,
    StudentFeeInvoice,
    StudentFeePayment,
    StudentFeeSummary,
    StudentNote
} from '../models/student.model';
import { STUDENT_COLUMN_SCHEMA, StudentColumnConfig } from '../../modules/students/config/student-columns.schema';

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/students`;
    private baseUrl = environment.apiUrl;

    getStudents(filters?: StudentFilters): Observable<Student[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.schoolId) params = params.set('schoolId', filters.schoolId);
            if (filters.class) params = params.set('class', filters.class);
            if (filters.section) params = params.set('section', filters.section);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.academicYear) params = params.set('academicYear', filters.academicYear);
            if (filters.gender) params = params.set('gender', filters.gender);
            if (filters.page) params = params.set('page', String(filters.page));
            if (filters.pageSize) params = params.set('pageSize', String(filters.pageSize));
            if (filters.sort) params = params.set('sort', filters.sort);
        }

        return this.http.get<Student[]>(this.apiUrl, { params });
    }

    getStudentFilters(filters?: StudentFilters): Observable<StudentFilterResponse> {
        let params = new HttpParams();
        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.schoolId) params = params.set('schoolId', filters.schoolId);
            if (filters.class) params = params.set('class', filters.class);
            if (filters.section) params = params.set('section', filters.section);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.academicYear) params = params.set('academicYear', filters.academicYear);
            if (filters.gender) params = params.set('gender', filters.gender);
        }
        return this.http.get<StudentFilterResponse>(`${this.apiUrl}/filters`, { params });
    }

    getStudent(id: string): Observable<Student> {
        return this.http.get<Student>(`${this.apiUrl}/${id}`);
    }

    getGuardianRelationships(): Observable<GuardianRelationshipOption[]> {
        return this.http.get<GuardianRelationshipOption[]>(`${this.baseUrl}/guardian-relationships`);
    }

    checkDuplicates(params: { firstName?: string; lastName?: string; dateOfBirth?: string; schoolId?: string; academicYear?: string }): Observable<Student[]> {
        let query = new HttpParams();
        if (params.firstName) query = query.set('firstName', params.firstName);
        if (params.lastName) query = query.set('lastName', params.lastName);
        if (params.dateOfBirth) query = query.set('dateOfBirth', params.dateOfBirth);
        if (params.schoolId) query = query.set('schoolId', params.schoolId);
        if (params.academicYear) query = query.set('academicYear', params.academicYear);
        return this.http.get<Student[]>(`${this.apiUrl}/duplicates`, { params: query });
    }

    getStudentColumns(): Observable<StudentColumnConfig[]> {
        return of(STUDENT_COLUMN_SCHEMA);
    }

    getStudentActivity(
        id: string,
        filters?: { category?: string; page?: number; pageSize?: number }
    ): Observable<StudentActivityItem[]> {
        let params = new HttpParams();
        if (filters?.category && filters.category !== 'all') {
            params = params.set('category', filters.category);
        }
        if (filters?.page) params = params.set('page', String(filters.page));
        if (filters?.pageSize) params = params.set('pageSize', String(filters.pageSize));
        return this.http.get<StudentActivityItem[]>(`${this.apiUrl}/${id}/activity`, { params });
    }

    getStudentGuardians(id: string): Observable<Guardian[]> {
        return this.http.get<Guardian[]>(`${this.apiUrl}/${id}/guardians`);
    }

    getStudentDocuments(id: string): Observable<Document[]> {
        return this.http.get<Document[]>(`${this.apiUrl}/${id}/documents`);
    }

    getStudentNotes(id: string): Observable<StudentNote[]> {
        return this.http.get<StudentNote[]>(`${this.apiUrl}/${id}/notes`);
    }

    getStudentAcademics(id: string): Observable<{ subjects: StudentAcademicSubject[]; terms: StudentAcademicTerm[] }> {
        return this.http.get<{ subjects: StudentAcademicSubject[]; terms: StudentAcademicTerm[] }>(
            `${this.apiUrl}/${id}/academics`
        );
    }

    getStudentFees(id: string): Observable<{ summary: StudentFeeSummary; invoices: StudentFeeInvoice[]; payments: StudentFeePayment[] }> {
        return this.http.get<{ summary: StudentFeeSummary; invoices: StudentFeeInvoice[]; payments: StudentFeePayment[] }>(
            `${this.apiUrl}/${id}/fees`
        );
    }

    previewArchive(ids: string[]): Observable<{ total: number; activeCount: number; linkedAccountsCount: number }> {
        return this.http.post<{ total: number; activeCount: number; linkedAccountsCount: number }>(
            `${this.apiUrl}/archive/impact`,
            { ids }
        );
    }

    bulkArchive(ids: string[]): Observable<{ deleted: number }> {
        return this.http.post<{ deleted: number }>(
            `${this.apiUrl}/archive`,
            { ids }
        );
    }

    createStudent(dto: CreateStudentDto): Observable<Student> {
        return this.http.post<Student>(this.apiUrl, dto);
    }

    updateStudent(id: string, dto: UpdateStudentDto): Observable<Student> {
        return this.http.patch<Student>(`${this.apiUrl}/${id}`, dto);
    }

    deleteStudent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    addGuardian(studentId: string, guardian: Omit<Guardian, 'id'>): Observable<Student> {
        return this.http.post<Student>(`${this.apiUrl}/${studentId}/guardians`, guardian);
    }

    updateEnrollment(studentId: string, enrollment: Partial<Student['enrollment']>): Observable<Student> {
        return this.http.patch<Student>(`${this.apiUrl}/${studentId}/enrollment`, enrollment);
    }

    importStudents(formData: FormData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/import`, formData);
    }

    exportStudents(filters?: StudentFilters): Observable<Blob> {
        let params = new HttpParams();

        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.schoolId) params = params.set('schoolId', filters.schoolId);
            if (filters.class) params = params.set('class', filters.class);
            if (filters.section) params = params.set('section', filters.section);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.academicYear) params = params.set('academicYear', filters.academicYear);
            if (filters.gender) params = params.set('gender', filters.gender);
        }

        return this.http.get(`${this.apiUrl}/export`, {
            params,
            responseType: 'blob'
        });
    }
}
