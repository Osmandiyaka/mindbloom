import { Injectable, inject } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClient } from '../http/api-client.service';

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
    private basePath = 'setup/school';
    private api = inject(ApiClient);

    getSettings(): Observable<SchoolSettings> {
        return this.api.get<SchoolSettings>(this.basePath);
    }

    save(settings: SchoolSettings) {
        return this.api.put<SchoolSettings>(this.basePath, settings);
    }

    uploadAsset(type: 'logo' | 'favicon', file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.requestEvents<{ url?: string; key?: string }>(
            'POST',
            `${this.basePath}/upload`,
            {
                body: formData,
                params: { type },
                reportProgress: true,
                observe: 'events'
            }
        );
    }
}
