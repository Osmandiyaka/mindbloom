/**
 * Module Entitlement Guard
 * 
 * Prevents navigation to disabled modules based on tenant plan/subscription.
 * Uses CanMatchFn to prevent route matching entirely (better than CanActivate for lazy loading).
 */

import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree, Route, UrlSegment } from '@angular/router';
import { EditionService } from '../services/entitlements.service';
import { ModuleKey } from '../types/module-keys';

/**
 * Guard function that checks if a module is enabled for current tenant
 * 
 * Usage in routes:
 * ```ts
 * {
 *   path: 'attendance',
 *   canMatch: [moduleEntitlementGuard],
 *   data: { moduleKey: 'attendance' },
 *   loadChildren: () => import('./attendance/attendance.routes')
 * }
 * ```
 * 
 * If module is disabled, redirects to /module-not-enabled with context
 */
export const moduleEntitlementGuard: CanMatchFn = (
    route: Route,
    segments: UrlSegment[]
): boolean | UrlTree => {
    const entitlements = inject(EditionService);
    const router = inject(Router);

    // Extract moduleKey from route data
    const moduleKey = route.data?.['moduleKey'] as ModuleKey | undefined;

    // If no moduleKey specified, allow access (guard is opt-in)
    if (!moduleKey) {
        return true;
    }

    // Special case: 'apply' is public, don't gate it
    if (moduleKey === 'apply') {
        return true;
    }

    // Prevent redirect loops - always allow access to module-not-enabled page
    const attemptedPath = '/' + segments.map(s => s.path).join('/');
    if (attemptedPath === '/module-not-enabled') {
        return true;
    }

    // Check if module is enabled for current tenant
    const isEnabled = entitlements.isEnabled(moduleKey);

    if (isEnabled) {
        return true;
    }

    // Module not enabled - redirect to not-enabled page with context
    const queryParams = {
        module: moduleKey,
        returnUrl: attemptedPath
    };

    console.log('[ModuleEntitlement] Access denied to module:', moduleKey, 'Attempted path:', attemptedPath);

    return router.createUrlTree(['/module-not-enabled'], { queryParams });
};

/**
 * Alternative: CanActivateFn version for child routes
 * Use this if you need to check entitlements on already-matched routes
 */
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const moduleEntitlementActivateGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean | UrlTree => {
    const entitlements = inject(EditionService);
    const router = inject(Router);

    // Extract moduleKey from route data
    const moduleKey = route.data?.['moduleKey'] as ModuleKey | undefined;

    // If no moduleKey specified, allow access
    if (!moduleKey) {
        return true;
    }

    // Special case: 'apply' is public, don't gate it
    if (moduleKey === 'apply') {
        return true;
    }

    // Prevent redirect loops
    if (state.url.startsWith('/module-not-enabled')) {
        return true;
    }

    // Check if module is enabled
    const isEnabled = entitlements.isEnabled(moduleKey);

    if (isEnabled) {
        return true;
    }

    // Module not enabled - redirect
    const queryParams = {
        module: moduleKey,
        returnUrl: state.url
    };

    console.log('[ModuleEntitlement] Access denied to module:', moduleKey, 'URL:', state.url);

    return router.createUrlTree(['/module-not-enabled'], { queryParams });
};
