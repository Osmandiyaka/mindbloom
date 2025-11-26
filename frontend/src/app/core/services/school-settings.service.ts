import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface SchoolSettings {
    schoolName: string;
    domain?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    timezone?: string;
    locale?: string;
    academicYear?: { start?: string; end?: string };
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    logoUrl?: string;
    gradingScheme?: { type?: string; passThreshold?: number };
    departments?: { name?: string; code?: string }[];
    grades?: { name?: string; code?: string; level?: string }[];
    subjects?: { name?: string; code?: string }[];
}

@Injectable({ providedIn: 'root' })
export class SchoolSettingsService {
    private base = `${environment.apiUrl}/setup/school`;
    constructor(private http: HttpClient) {}

    getSettings(): Observable<SchoolSettings> {
        return this.http.get<SchoolSettings>(this.base);
    }

    save(settings: SchoolSettings) {
        return this.http.put(this.base, settings);
    }
}
