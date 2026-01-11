import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

import { Tenant } from './tenant.service';

export interface TenantSettingsUpdate {
    customization?: {
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        customDomain?: string;
    };
    locale?: string;
    timezone?: string;
    weekStartsOn?: 'monday' | 'sunday';
    currency?: string;
    academicYear?: {
        start?: string | Date;
        end?: string | Date;
        name?: string;
    };
    idTemplates?: {
        admissionPrefix?: string;
        admissionSeqLength?: number;
        includeYear?: boolean;
        resetPerYear?: boolean;
        rollPrefix?: string;
        rollSeqLength?: number;
        sampleClass?: string;
        sampleSection?: string;
        resetPerClass?: boolean;
    };
    extras?: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class TenantSettingsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/tenants/settings`;

    getSettings(): Observable<Tenant> {
        return this.http.get<Tenant>(this.baseUrl);
    }

    updateSettings(payload: TenantSettingsUpdate): Observable<Tenant> {
        const body: any = {
            ...payload,
            primaryColor: payload.customization?.primaryColor,
            secondaryColor: payload.customization?.secondaryColor,
            accentColor: payload.customization?.accentColor,
            logo: payload.customization?.logo,
            customDomain: payload.customization?.customDomain,
            academicYearStart: payload.academicYear?.start ? new Date(payload.academicYear.start) : undefined,
            academicYearEnd: payload.academicYear?.end ? new Date(payload.academicYear.end) : undefined,
            idTemplates: payload.idTemplates,
            extras: payload.extras,
        };
        delete body.customization;
        delete body.academicYear;
        return this.http.put<Tenant>(this.baseUrl, body);
    }
}
