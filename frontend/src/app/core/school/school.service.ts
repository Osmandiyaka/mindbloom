import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { School } from './school.models';

@Injectable({
    providedIn: 'root'
})
export class SchoolService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/schools`;

    listSchools(): Observable<School[]> {
        return this.http.get<School[]>(this.apiUrl);
    }

    createSchool(input: { name: string; code?: string; type?: string; status?: string; domain?: string }): Observable<School> {
        return this.http.post<School>(this.apiUrl, input);
    }
}
