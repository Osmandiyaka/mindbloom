/**
 * TenantBootstrapService - Coordinates tenant switching
 * Ensures permissions and entitlements are reloaded cleanly
 */

import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { TenantContextService, TenantMembership } from './tenant-context.service';
import { SchoolContextService } from '../school/school-context.service';
import { EditionService } from '../../shared/services/entitlements.service';
import { PermissionsService } from '../services/permissions.service';
import { RbacService } from '../rbac/rbac.service';

export type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({
    providedIn: 'root'
})
export class TenantBootstrapService {
    private readonly tenantContext = inject(TenantContextService);
    private readonly schoolContext = inject(SchoolContextService);
    private readonly entitlements = inject(EditionService);
    private readonly permissionsService = inject(PermissionsService);
    private readonly rbacService = inject(RbacService);

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
        this.schoolContext.refreshSchools();

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
     */
    private reloadPermissions(tenantId: string): Observable<void> {
        console.log('[TenantBootstrap] Reloading permissions for tenant:', tenantId);

        return this.permissionsService.loadPermissions().pipe(
            tap((permissions) => {
                const session = this.rbacService.getSession();
                if (session) {
                    this.rbacService.setSession({
                        ...session,
                        permissionOverrides: { allow: permissions },
                    });
                }
                console.log('[TenantBootstrap] Permissions reloaded');
            }),
            map(() => void 0),
            catchError((error) => {
                console.warn('[TenantBootstrap] Failed to reload permissions', error);
                return of(void 0);
            }),
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

        return this.entitlements.loadEntitlements().pipe(
            tap(() => {
                console.log('[TenantBootstrap] Entitlements reloaded');
            }),
            map(() => void 0),
            catchError((error) => {
                console.warn('[TenantBootstrap] Failed to reload entitlements', error);
                return of(void 0);
            }),
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
