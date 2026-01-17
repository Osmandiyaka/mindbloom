import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ClassPayload {
    name: string;
    code?: string;
    levelType?: string;
    sortOrder?: number;
    active?: boolean;
    schoolIds?: string[] | null;
    notes?: string;
}

export interface ClassResponse extends ClassPayload {
    _id?: string;
    id?: string;
}

export interface SectionResponse {
    _id?: string;
    id?: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number;
    active?: boolean;
    homeroomTeacherId?: string | null;
    sortOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class ClassSectionService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/setup/classes`;

    createClass(payload: ClassPayload): Observable<ClassResponse> {
        return this.http.post<ClassResponse>(this.baseUrl, payload);
    }

    updateClass(id: string, payload: Partial<ClassPayload>): Observable<ClassResponse> {
        return this.http.patch<ClassResponse>(`${this.baseUrl}/${id}`, payload);
    }

    listClasses(): Observable<ClassResponse[]> {
        return this.http.get<ClassResponse[]>(this.baseUrl);
    }

    listSections(classId?: string): Observable<SectionResponse[]> {
        let params = new HttpParams();
        if (classId) {
            params = params.set('classId', classId);
        }
        return this.http.get<SectionResponse[]>(`${this.baseUrl}/sections`, { params });
    }

    createSection(payload: {
        classId: string;
        name: string;
        code?: string;
        capacity?: number | null;
        homeroomTeacherId?: string | null;
        active?: boolean;
        sortOrder?: number;
    }): Observable<SectionResponse> {
        return this.http.post<SectionResponse>(`${this.baseUrl}/sections`, payload);
    }

    updateSection(id: string, payload: Partial<{
        classId: string;
        name: string;
        code?: string;
        capacity?: number | null;
        homeroomTeacherId?: string | null;
        active?: boolean;
        sortOrder?: number;
    }>): Observable<SectionResponse> {
        return this.http.patch<SectionResponse>(`${this.baseUrl}/sections/${id}`, payload);
    }

    deleteSection(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/sections/${id}`);
    }

    deleteClass(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
