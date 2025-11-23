import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private readonly STORAGE_KEY = 'mindbloom_tenant';
    private currentTenant = signal<string>('Default');

    constructor() {
        // Load tenant from localStorage on init
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.currentTenant.set(saved);
        }
    }

    getCurrentTenant(): string {
        return this.currentTenant();
    }

    setTenant(tenantCode: string): void {
        this.currentTenant.set(tenantCode);
        localStorage.setItem(this.STORAGE_KEY, tenantCode);
    }

    clearTenant(): void {
        this.currentTenant.set('Default');
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
