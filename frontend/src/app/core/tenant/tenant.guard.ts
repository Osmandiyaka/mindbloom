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
 * - Redirects to /select-school with returnUrl
 * - Redirects host sessions to /host (no tenant required)
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TenantContextService } from './tenant-context.service';

export const tenantGuard: CanActivateFn = (route, state) => {
    const tenantContext = inject(TenantContextService);
    const router = inject(Router);
    const authService = inject(AuthService);

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

    // Check if tenant context exists
    if (tenantContext.hasTenant()) {
        return true;
    }

    // No tenant context - redirect to selection screen with returnUrl
    return router.createUrlTree(['/select-school'], {
        queryParams: { returnUrl: state.url }
    });
};
