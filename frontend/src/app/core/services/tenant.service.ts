import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    status: 'active' | 'suspended' | 'inactive';
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    settings?: {
        maxStudents?: number;
        maxTeachers?: number;
        maxClasses?: number;
        features?: string[];
        customization?: {
            logo?: string;
            primaryColor?: string;
            secondaryColor?: string;
        };
    };
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

    getTenantBySubdomain(subdomain: string): Observable<Tenant> {
        return this.http.get<Tenant>(`${this.API_URL}/tenants/subdomain/${subdomain}`);
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
        return tenant?.id || null;
    }

    canAccessFeature(feature: string): boolean {
        const tenant = this.getCurrentTenantValue();
        if (!tenant) return false;

        const featuresByPlan = {
            free: ['basic_features'],
            basic: ['basic_features', 'student_management', 'attendance'],
            premium: ['basic_features', 'student_management', 'attendance', 'finance', 'library'],
            enterprise: ['basic_features', 'student_management', 'attendance', 'finance', 'library', 'hr', 'transport', 'hostel'],
        };

        return featuresByPlan[tenant.plan]?.includes(feature) || false;
    }

    private getTenantFromStorage(): Tenant | null {
        const tenantStr = localStorage.getItem(this.STORAGE_KEY);
        return tenantStr ? JSON.parse(tenantStr) : null;
    }
}
