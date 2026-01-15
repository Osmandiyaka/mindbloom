/**
 * Module Entitlement Guard
 * 
 * Prevents navigation to disabled modules based on tenant edition.
 * Uses CanMatchFn to prevent route matching entirely (better than CanActivate for lazy loading).
 */

import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree, Route, UrlSegment } from '@angular/router';
import { EditionService } from '../services/entitlements.service';
import { ModuleKey } from '../types/module-keys';
import { catchError, map, of } from 'rxjs';

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
): boolean | UrlTree | import('rxjs').Observable<boolean | UrlTree> => {
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

    return entitlements.loadEntitlements().pipe(
        map((snapshot) => {
            if (snapshot.requiresEditionSelection) {
                return router.createUrlTree(['/onboarding']);
            }

            const isEnabled = entitlements.isEnabled(moduleKey);
            if (isEnabled) {
                return true;
            }

            const queryParams = {
                module: moduleKey,
                returnUrl: attemptedPath,
                reason: 'NOT_IN_PLAN'
            };

            console.log('[ModuleEntitlement] Access denied to module:', moduleKey, 'Attempted path:', attemptedPath);
            return router.createUrlTree(['/module-not-enabled'], { queryParams });
        }),
        catchError(() => of(true))
    );
};

/**
 * Alternative: CanActivateFn version for child routes
 * Use this if you need to check entitlements on already-matched routes
 */
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const moduleEntitlementActivateGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean | UrlTree | import('rxjs').Observable<boolean | UrlTree> => {
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

    return entitlements.loadEntitlements().pipe(
        map((snapshot) => {
            if (snapshot.requiresEditionSelection) {
                return router.createUrlTree(['/onboarding']);
            }

            const isEnabled = entitlements.isEnabled(moduleKey);
            if (isEnabled) {
                return true;
            }

            const queryParams = {
                module: moduleKey,
                returnUrl: state.url,
                reason: 'NOT_IN_PLAN'
            };

            console.log('[ModuleEntitlement] Access denied to module:', moduleKey, 'URL:', state.url);
            return router.createUrlTree(['/module-not-enabled'], { queryParams });
        }),
        catchError(() => of(true))
    );
};
