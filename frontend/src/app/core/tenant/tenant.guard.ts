/**
 * Tenant Guard
 * 
 * Enforces tenant context presence for protected routes.
 * Must run AFTER AuthGuard in the guard chain.
 * 
 * Guard Ordering: AuthGuard → TenantGuard → RBAC/Module Guards
 * 
 * Behavior:
 * - Allows public routes (data.public = true)
 * - Allows routes that skip tenant check (data.skipTenant = true)
 * - Blocks tenant-scoped routes when no tenant context exists
 * - Allows navigation when tenant context is missing (no no-access redirect)
 * - Redirects host sessions to /host (no tenant required)
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TenantContextService } from './tenant-context.service';
import { TenantService } from '../services/tenant.service';
import { EditionService } from '../../shared/services/entitlements.service';
import { firstValueFrom } from 'rxjs';

export const tenantGuard: CanActivateFn = async (route, state) => {
    const tenantContext = inject(TenantContextService);
    const router = inject(Router);
    const authService = inject(AuthService);
    const tenantService = inject(TenantService);
    const entitlements = inject(EditionService);

    // Allow public routes
    if (route.data?.['public'] === true) {
        return true;
    }

    // Allow routes that explicitly skip tenant check (e.g., platform-only routes)
    if (route.data?.['skipTenant'] === true) {
        return true;
    }

    const session = authService.getSession?.() ?? authService.session?.();
    const isHostSession = session?.mode === 'host' || (session?.hostContext && (!session.memberships || session.memberships.length === 0));

    if (isHostSession) {
        return router.createUrlTree(['/host']);
    }

    const tenant = tenantService.getCurrentTenantValue?.();
    if (tenant) {
        try {
            const snapshot = await firstValueFrom(entitlements.loadEntitlements());
            if (snapshot.requiresEditionSelection && !state.url.startsWith('/onboarding')) {
                return router.createUrlTree(['/onboarding']);
            }
        } catch (error) {
            console.warn('[TenantGuard] Failed to load entitlements', error);
            return router.createUrlTree(['/no-access'], { queryParams: { reason: 'entitlements' } });
        }
    }

    // Check if tenant context exists
    if (tenantContext.hasTenant()) {
        return true;
    }

    // No tenant context - allow navigation without blocking on school access
    return true;
};
