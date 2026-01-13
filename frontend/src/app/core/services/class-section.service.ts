import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
