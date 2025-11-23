import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Student,
    CreateStudentDto,
    UpdateStudentDto,
    StudentFilters,
    Guardian
} from '../models/student.model';

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/students`;

    getStudents(filters?: StudentFilters): Observable<Student[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.class) params = params.set('class', filters.class);
            if (filters.section) params = params.set('section', filters.section);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.academicYear) params = params.set('academicYear', filters.academicYear);
            if (filters.gender) params = params.set('gender', filters.gender);
        }

        return this.http.get<Student[]>(this.apiUrl, { params });
    }

    getStudent(id: string): Observable<Student> {
        return this.http.get<Student>(`${this.apiUrl}/${id}`);
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
}
