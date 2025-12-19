/**
 * TenantBootstrapService - Coordinates tenant switching
 * Ensures permissions and entitlements are reloaded cleanly
 */

import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { TenantContextService, TenantMembership } from './tenant-context.service';

export type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({
    providedIn: 'root'
})
export class TenantBootstrapService {
    private readonly tenantContext = inject(TenantContextService);

    // Bootstrap loading state
    readonly status = signal<BootstrapStatus>('idle');
    readonly isLoading = signal<boolean>(false);

    /**
     * Switch to a new tenant and reload all tenant-scoped data
     */
    switchTenant(tenant: TenantMembership): Observable<boolean> {
        console.log('[TenantBootstrap] Switching to tenant:', tenant.tenantName);

        this.status.set('loading');
        this.isLoading.set(true);

        // Set active tenant first
        this.tenantContext.setActiveTenant(tenant);

        // Reload tenant-scoped services
        return forkJoin({
            permissions: this.reloadPermissions(tenant.tenantId),
            entitlements: this.reloadEntitlements(tenant.tenantId)
        }).pipe(
            map(() => {
                this.status.set('ready');
                console.log('[TenantBootstrap] Tenant switch completed');
                return true;
            }),
            catchError((error) => {
                console.error('[TenantBootstrap] Failed to switch tenant:', error);
                this.status.set('error');
                return of(false);
            }),
            finalize(() => {
                this.isLoading.set(false);
            })
        );
    }

    /**
     * Reload permissions for tenant
     * TODO: Integrate with actual PermissionsService when implemented
     */
    private reloadPermissions(tenantId: string): Observable<void> {
        console.log('[TenantBootstrap] Reloading permissions for tenant:', tenantId);

        // Placeholder - replace with actual permission loading
        // Example: return this.permissionsService.loadForTenant(tenantId);

        return of(void 0).pipe(
            tap(() => {
                // Clear any cached permissions
                console.log('[TenantBootstrap] Permissions reloaded');
            })
        );
    }

    /**
     * Reload entitlements/features for tenant
     * TODO: Integrate with actual EntitlementsService when implemented
     */
    private reloadEntitlements(tenantId: string): Observable<void> {
        console.log('[TenantBootstrap] Reloading entitlements for tenant:', tenantId);

        // Placeholder - replace with actual entitlement loading
        // Example: return this.entitlementsService.loadForTenant(tenantId);

        return of(void 0).pipe(
            tap(() => {
                // Load plan features, module access, etc.
                console.log('[TenantBootstrap] Entitlements reloaded');
            })
        );
    }

    /**
     * Wait for bootstrap to complete
     */
    whenReady(): Observable<boolean> {
        if (this.status() === 'ready') {
            return of(true);
        }

        // Return observable that completes when ready
        // In real implementation, use a ReplaySubject or similar
        return of(false);
    }

    /**
     * Reset bootstrap state
     */
    reset(): void {
        this.status.set('idle');
        this.isLoading.set(false);
    }
}
