import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface StudentStub {
    id: string;
    fullName: string;
    grade: string;
    email?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
    students = signal<StudentStub[]>([]);

    constructor(private http: HttpClient) {
        this.refresh();
    }

    refresh() {
        this.http.get<StudentStub[]>(`${environment.apiUrl}/students`).subscribe(students => {
            this.students.set(students);
        });
    }

    createFromAdmission(input: { name: string; grade: string; email?: string }) {
        return this.http.post<StudentStub>(`${environment.apiUrl}/students`, {
            fullName: input.name,
            grade: input.grade,
            email: input.email
        }).subscribe(() => this.refresh());
    }
}
