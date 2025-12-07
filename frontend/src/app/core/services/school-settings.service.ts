import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
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
    faviconUrl?: string;
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

    uploadAsset(type: 'logo' | 'favicon', file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url?: string; key?: string }>(
            `${this.base}/upload`,
            formData,
            {
                params: { type },
                reportProgress: true,
                observe: 'events'
            }
        ) as unknown as Observable<HttpEvent<{ url?: string; key?: string }>>;
    }
}
