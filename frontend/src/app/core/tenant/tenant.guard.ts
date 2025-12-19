/**
 * Tenant guard.
 * 
 * Ensures tenant context is available before activating protected routes.
 * Routes to tenant selection if user is authenticated but has no active tenant.
 * Prevents "flash" of tenant UI without tenant context.
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TenantResolverService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';
import { AuthService } from '../auth/auth.service';

export const tenantGuard: CanActivateFn = async (route, state) => {
    const tenantResolverService = inject(TenantResolverService);
    const tenantContext = inject(TenantContextService);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Allow public routes (marked with data: { public: true })
    if (route.data?.['public'] === true) {
        return true;
    }

    // Check if user is authenticated
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Not authenticated, let auth guard handle it
        return true;
    }

    // Check if tenant context is already set
    const activeTenant = tenantContext.activeTenant();

    if (activeTenant) {
        // Tenant context exists, allow access
        return true;
    }

    // No active tenant - try to resolve from environment (URL, JWT, etc.)
    const resolved = await tenantResolverService.resolveTenant();

    if (resolved) {
        // Tenant resolved successfully
        return true;
    }

    // No tenant context available
    // Check if user has memberships to choose from
    const session = authService.session();
    const memberships = session?.memberships || [];

    if (memberships.length === 0) {
        // No access to any tenants
        return router.createUrlTree(['/no-access']);
    }

    // User has memberships but no active tenant - redirect to selection
    return router.createUrlTree(['/select-school'], {
        queryParams: { returnUrl: state.url }
    });
};
