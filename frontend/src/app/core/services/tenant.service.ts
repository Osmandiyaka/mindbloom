import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TenantStatus = 'pending' | 'active' | 'suspended' | 'inactive' | 'deleted';
export type TenantEdition = 'free' | 'professional' | 'premium' | 'enterprise';

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    status: TenantStatus;
    editionId?: string | null;
    edition?: TenantEdition | null;
    ownerId?: string | null;
    contactInfo: {
        email: string;
        phone?: string;
        alternateEmail?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
    };
    customization?: {
        logo?: string;
        favicon?: string;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        customDomain?: string;
        emailTemplate?: string;
    };
    enabledModules?: string[];
    locale?: string;
    timezone?: string;
    weekStartsOn?: 'monday' | 'sunday';
    currency?: string;
    academicYear?: {
        start?: string | Date;
        end?: string | Date;
        name?: string;
    };
    limits?: Record<string, any>;
    usage?: Record<string, any>;
    trialEndsAt?: string;
    metadata?: Record<string, any>;
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

export interface TenantLookup {
    id: string;
    name: string;
    subdomain: string;
    customDomain?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private readonly API_URL = environment.apiUrl;
    private readonly STORAGE_KEY = 'mindbloom_tenant';

    private currentTenantSubject = new BehaviorSubject<Tenant | null>(this.getTenantFromStorage());
    public currentTenant$ = this.currentTenantSubject.asObservable();

    // Signal for reactive tenant state
    public currentTenant = signal<Tenant | null>(this.getTenantFromStorage());

    constructor(private http: HttpClient) { }

    getTenantById(id: string): Observable<Tenant> {
        return this.http.get<Tenant>(`${this.API_URL}/tenants/${id}`);
    }

    listPublicEditions(): Observable<Array<{ id: string; name: string; displayName: string; description?: string | null; features: Record<string, string>; monthlyPrice?: number | null; annualPrice?: number | null; perStudentMonthly?: number | null; annualPriceNotes?: string | null; isActive?: boolean }>> {
        return this.http.get<Array<{ id: string; name: string; displayName: string; description?: string | null; features: Record<string, string>; monthlyPrice?: number | null; annualPrice?: number | null; perStudentMonthly?: number | null; annualPriceNotes?: string | null; isActive?: boolean }>>(`${this.API_URL}/editions`);
    }

    getTenantBySubdomain(subdomain: string): Observable<Tenant> {
        return this.http.get<Tenant>(`${this.API_URL}/tenants/subdomain/${subdomain}`);
    }

    searchTenants(search: string, limit = 6): Observable<TenantLookup[]> {
        const params = new HttpParams()
            .set('search', search)
            .set('limit', String(limit));
        return this.http.get<TenantLookup[]>(`${this.API_URL}/tenants/lookup`, { params });
    }

    getTenantByCode(code: string): Observable<Tenant> {
        return this.http.get<Tenant>(`${this.API_URL}/tenants/code/${code}`).pipe(
            tap(tenant => {
                if (tenant) {
                    this.setTenant(tenant);
                }
            })
        );
    }

    createTenant(data: {
        name: string;
        subdomain: string;
        contactEmail: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
        ownerId?: string;
        edition?: TenantEdition;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        timezone?: string;
        metadata?: Record<string, any>;
    }): Observable<Tenant> {
        return this.http.post<Tenant>(`${this.API_URL}/tenants`, data).pipe(
            tap(tenant => {
                if (tenant) {
                    this.setTenant(tenant);
                }
            })
        );
    }

    setTenant(tenant: Tenant): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tenant));
        this.currentTenantSubject.next(tenant);
        this.currentTenant.set(tenant);
    }

    getCurrentTenantValue(): Tenant | null {
        return this.currentTenantSubject.value;
    }

    clearTenant(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.currentTenantSubject.next(null);
        this.currentTenant.set(null);
    }

    getTenantId(): string | null {
        const tenant = this.getCurrentTenantValue();
        return tenant?.id || environment.tenantId || null;
    }

    canAccessFeature(feature: string): boolean {
        const tenant = this.getCurrentTenantValue();
        if (!tenant) return false;

        const featuresByEdition: Record<TenantEdition, string[]> = {
            free: ['basic_features', 'student_management', 'attendance', 'basic_reporting'],
            professional: ['basic_features', 'timetabling', 'reporting', 'library', 'fees'],
            premium: ['basic_features', 'multi_school', 'rbac', 'finance', 'analytics', 'transport'],
            enterprise: ['basic_features', 'sso', 'audit_logs', 'rbac', 'unlimited_storage', 'priority_support'],
        };

        const code = tenant.editionId ?? tenant.edition;
        if (!code) return false;
        return featuresByEdition[code as TenantEdition]?.includes(feature) || false;
    }

    private getTenantFromStorage(): Tenant | null {
        const tenantStr = localStorage.getItem(this.STORAGE_KEY);
        return tenantStr ? JSON.parse(tenantStr) : null;
    }
}
