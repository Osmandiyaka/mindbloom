/**
 * Permission Guard - Route-level Authorization
 * 
 * Prevents unauthorized access to routes based on user permissions.
 * Implements both CanActivateFn and CanMatchFn to prevent page flashes.
 * 
 * Usage:
 * - CanMatch for lazy-loaded module entry points (prevents module loading)
 * - CanActivate for sensitive child routes (create/edit actions)
 * 
 * Route configuration:
 * {
 *   path: 'students',
 *   canMatch: [permissionMatchGuard],
 *   canActivate: [permissionGuard],
 *   data: { permissions: ['students.read'] }
 * }
 */

import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RbacService } from '../rbac/rbac.service';

/**
 * Check if user has required permissions
 */
function normalizePermissions(required: string[] | undefined): string[] {
    if (!required || required.length === 0) return [];
    return required.map((perm) => perm.replace(/:/g, '.').trim().toLowerCase());
}

/**
 * CanActivate guard for route-level permission checks
 * 
 * Prevents navigation to routes that require specific permissions.
 * Redirects unauthorized users to /access-denied with return URL.
 */
export const permissionGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const rbacService = inject(RbacService);
    const router = inject(Router);

    const requiredPermissions = normalizePermissions(route.data?.['permissions'] as string[] | undefined);

    if (requiredPermissions.length === 0) {
        return true;
    }

    const session = authService.getSession();
    if (!session) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
        });
    }

    await authService.ensureRbacLoaded();

    const membership = authService.getActiveMembership();
    const isElevated = membership?.roles?.some((role) => role === 'Host Admin' || role === 'Tenant Admin');

    if (isElevated) {
        return true;
    }

    const hasPermissions = rbacService.canAll(requiredPermissions);
    if (hasPermissions) {
        return true;
    }

    return router.createUrlTree(['/access-denied'], {
        queryParams: { from: state.url },
    });
};

/**
 * CanMatch guard for lazy-loaded module entry points
 * 
 * Prevents module from loading if user lacks permissions.
 * This is critical for preventing page flashes - the module code
 * is never loaded or executed if the user is unauthorized.
 */
export const permissionMatchGuard: CanMatchFn = async (route, segments) => {
    const authService = inject(AuthService);
    const rbacService = inject(RbacService);
    const router = inject(Router);

    const requiredPermissions = normalizePermissions(route.data?.['permissions'] as string[] | undefined);

    if (requiredPermissions.length === 0) {
        return true;
    }

    const session = authService.getSession();
    const attemptedUrl = '/' + segments.map((s) => s.path).join('/');

    if (!session) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: attemptedUrl },
        });
    }

    await authService.ensureRbacLoaded();

    const membership = authService.getActiveMembership();
    const isElevated = membership?.roles?.some((role) => role === 'Host Admin' || role === 'Tenant Admin');

    if (isElevated) {
        return true;
    }

    const hasPermissions = rbacService.canAll(requiredPermissions);
    if (hasPermissions) {
        return true;
    }

    return router.createUrlTree(['/access-denied'], {
        queryParams: { from: attemptedUrl },
    });
};
