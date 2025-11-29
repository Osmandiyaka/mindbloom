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
            academicYearStart: payload.academicYear?.start ? new Date(payload.academicYear.start) : undefined,
            academicYearEnd: payload.academicYear?.end ? new Date(payload.academicYear.end) : undefined,
        };
        delete body.customization;
        delete body.academicYear;
        return this.http.put<Tenant>(this.baseUrl, body);
    }
}
