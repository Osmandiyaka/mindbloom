/**
 * Tenant resolver guard.
 * 
 * Ensures tenant is resolved before activating protected routes.
 * Prevents "flash" of tenant UI without tenant context.
 * Redirects to dedicated "tenant not found" screen on failure.
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TenantResolverService } from './tenant.service';

export const tenantGuard: CanActivateFn = async (route, state) => {
    const tenantService = inject(TenantResolverService);
    const router = inject(Router);

    // Allow public routes (marked with data: { public: true })
    if (route.data?.['public'] === true) {
        return true;
    }

    // Resolve tenant (awaits full resolution, blocking)
    const resolved = await tenantService.resolveTenant();

    if (resolved) {
        // Tenant resolved successfully
        return true;
    }

    // Tenant resolution failed; redirect to dedicated error page
    const status = tenantService.status();
    if (status === 'not-found') {
        return router.createUrlTree(['/tenant-not-found']);
    }

    // Network or other error
    return router.createUrlTree(['/tenant-not-found'], {
        queryParams: { reason: 'error' }
    });
};
