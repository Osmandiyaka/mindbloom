import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, map } from 'rxjs';

export interface ClassPayload {
    name: string;
    code?: string;
    sortOrder?: number;
    schoolIds: string[];
    notes?: string;
}

export interface ClassResponse extends ClassPayload {
    _id?: string;
    id?: string;
    status?: 'active' | 'archived';
}

export interface SectionResponse {
    _id?: string;
    id?: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number;
    status?: 'active' | 'archived';
    sortOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class ClassSectionService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/classes`;
    private readonly sectionsUrl = `${environment.apiUrl}/sections`;

    createClass(payload: ClassPayload): Observable<ClassResponse> {
        return this.http.post<ClassResponse>(this.baseUrl, {
            ...payload,
            schoolIds: Array.isArray(payload.schoolIds) ? payload.schoolIds : [],
        });
    }

    updateClass(id: string, payload: Partial<ClassPayload>): Observable<ClassResponse> {
        return this.http.patch<ClassResponse>(`${this.baseUrl}/${id}`, {
            ...payload,
            schoolIds: payload.schoolIds ? payload.schoolIds : undefined,
        });
    }

    listClasses(): Observable<ClassResponse[]> {
        return this.http.get<ClassResponse[] | { data: ClassResponse[] }>(this.baseUrl).pipe(
            map((response) => Array.isArray(response) ? response : (response.data || []))
        );
    }

    listSections(classId?: string): Observable<SectionResponse[]> {
        if (!classId) {
            return of([]);
        }
        return this.http.get<SectionResponse[]>(`${this.baseUrl}/${classId}/sections`);
    }

    createSection(payload: {
        classId: string;
        name: string;
        code?: string;
        capacity?: number | null;
        active?: boolean;
        sortOrder?: number;
    }): Observable<SectionResponse> {
        const { classId, ...body } = payload;
        return this.http.post<SectionResponse>(`${this.baseUrl}/${classId}/sections`, body);
    }

    updateSection(id: string, payload: Partial<{
        classId: string;
        name: string;
        code?: string;
        capacity?: number | null;
        active?: boolean;
        sortOrder?: number;
    }>): Observable<SectionResponse> {
        return this.http.patch<SectionResponse>(`${this.sectionsUrl}/${id}`, payload);
    }

    deleteSection(id: string): Observable<void> {
        return this.http.delete<void>(`${this.sectionsUrl}/${id}`);
    }

    deleteClass(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
