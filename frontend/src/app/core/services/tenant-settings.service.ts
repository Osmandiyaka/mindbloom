import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface TenantSettings {
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
        start: string;
        end: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class TenantSettingsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/tenants/settings`;

    getSettings(): Observable<TenantSettings> {
        return this.http.get<TenantSettings>(this.baseUrl);
    }

    updateSettings(payload: Partial<TenantSettings>): Observable<TenantSettings> {
        const body: any = {
            ...payload,
            primaryColor: payload.customization?.primaryColor,
            secondaryColor: payload.customization?.secondaryColor,
            accentColor: payload.customization?.accentColor,
            logo: payload.customization?.logo,
            academicYearStart: payload.academicYear?.start,
            academicYearEnd: payload.academicYear?.end,
        };
        delete body.customization;
        delete body.academicYear;
        return this.http.put<TenantSettings>(this.baseUrl, body);
    }
}
