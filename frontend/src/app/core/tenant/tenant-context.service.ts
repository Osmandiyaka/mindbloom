/**
 * TenantContextService - Single source of truth for active tenant
 * Manages tenant selection, switching, and persistence
 */

import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TenantMembership } from '../auth/auth.models';

// Re-export for convenience
export type { TenantMembership };

const STORAGE_KEY = 'eduhub:lastTenantId';

@Injectable({
    providedIn: 'root'
})
export class TenantContextService {
    // Active tenant state (both observable and signal for compatibility)
    private readonly _activeTenant$ = new BehaviorSubject<TenantMembership | null>(null);
    readonly activeTenant$ = this._activeTenant$.asObservable();

    // Signal-based state (for Angular 17 reactivity)
    readonly activeTenantSignal = signal<TenantMembership | null>(null);
    readonly hasActiveTenant = computed(() => this.activeTenantSignal() !== null);
    readonly activeTenantId = computed(() => this.activeTenantSignal()?.tenantId ?? null);
    readonly activeTenantSlug = computed(() => this.activeTenantSignal()?.tenantSlug ?? null);

    /**
     * Get current active tenant (synchronous)
     */
    activeTenant(): TenantMembership | null {
        return this._activeTenant$.value;
    }

    /**
     * Set active tenant and persist to storage
     */
    setActiveTenant(tenant: TenantMembership | null): void {
        if (!tenant) {
            this.clearTenant();
            return;
        }

        // Update both observable and signal
        this._activeTenant$.next(tenant);
        this.activeTenantSignal.set(tenant);

        // Persist only tenantId to storage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                tenantId: tenant.tenantId,
                slug: tenant.tenantSlug
            }));
            console.log('[TenantContext] Active tenant set:', tenant.tenantName);
        } catch (error) {
            console.warn('[TenantContext] Failed to persist tenant:', error);
        }
    }

    /**
     * Clear active tenant from memory and storage
     */
    clearTenant(): void {
        this._activeTenant$.next(null);
        this.activeTenantSignal.set(null);

        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[TenantContext] Tenant cleared');
        } catch (error) {
            console.warn('[TenantContext] Failed to clear tenant storage:', error);
        }
    }

    /**
     * Load last-used tenant from storage
     * Returns the stored tenant reference if found
     */
    loadFromStorage(): { tenantId: string; tenantSlug: string } | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);
            if (parsed?.tenantId && (parsed?.slug || parsed?.tenantSlug)) {
                console.log('[TenantContext] Loaded last tenant from storage:', parsed.tenantId);
                return {
                    tenantId: parsed.tenantId,
                    tenantSlug: parsed.slug || parsed.tenantSlug
                };
            }
        } catch (error) {
            console.warn('[TenantContext] Failed to load tenant from storage:', error);
        }
        return null;
    }

    /**
     * Find and set active tenant from memberships list
     * Uses stored preference if valid, otherwise returns false
     */
    restoreFromMemberships(memberships: TenantMembership[]): boolean {
        const stored = this.loadFromStorage();

        if (!stored) {
            return false;
        }

        // Find tenant in current memberships
        const tenant = memberships.find(m => m.tenantId === stored.tenantId);

        if (tenant) {
            this.setActiveTenant(tenant);
            return true;
        }

        // Stored tenant no longer valid, clear it
        this.clearTenant();
        return false;
    }
}
