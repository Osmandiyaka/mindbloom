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
}
