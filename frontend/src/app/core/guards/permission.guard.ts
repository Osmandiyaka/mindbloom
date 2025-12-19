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
 *   data: { permissions: ['students:read'] }
 * }
 */

import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Check if user has required permissions
 */
function checkPermissions(requiredPermissions: string[], user: any): boolean {
    if (!user) {
        return false;
    }

    // SuperAdmin has all permissions
    if (user.role?.name === 'SuperAdmin') {
        return true;
    }

    // Check if user's role has all required permissions (AND semantics)
    if (!user.role || !user.role.permissions) {
        return false;
    }

    return requiredPermissions.every(requiredPermission => {
        const [resource, action] = requiredPermission.split(':');

        return user.role.permissions.some((permission: any) => {
            return permission.resource === resource &&
                (permission.actions.includes(action) ||
                    permission.actions.includes('manage'));
        });
    });
}

/**
 * CanActivate guard for route-level permission checks
 * 
 * Prevents navigation to routes that require specific permissions.
 * Redirects unauthorized users to /access-denied with return URL.
 */
export const permissionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Get required permissions from route data
    const requiredPermissions = route.data?.['permissions'] as string[] | undefined;

    // If no permissions specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    // Check if user is authenticated
    const user = authService.getCurrentUser();
    if (!user) {
        // Not authenticated - redirect to login with return URL
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
        });
    }

    // Check if user has required permissions
    if (checkPermissions(requiredPermissions, user)) {
        return true;
    }

    // User is authenticated but lacks permissions - redirect to access denied
    return router.createUrlTree(['/access-denied'], {
        queryParams: { from: state.url }
    });
};

/**
 * CanMatch guard for lazy-loaded module entry points
 * 
 * Prevents module from loading if user lacks permissions.
 * This is critical for preventing page flashes - the module code
 * is never loaded or executed if the user is unauthorized.
 */
export const permissionMatchGuard: CanMatchFn = (route, segments) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Get required permissions from route data
    const requiredPermissions = route.data?.['permissions'] as string[] | undefined;

    // If no permissions specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    // Check if user is authenticated
    const user = authService.getCurrentUser();
    if (!user) {
        // Not authenticated - redirect to login
        // Build attempted URL from segments
        const attemptedUrl = '/' + segments.map(s => s.path).join('/');
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: attemptedUrl }
        });
    }

    // Check if user has required permissions
    if (checkPermissions(requiredPermissions, user)) {
        return true;
    }

    // User is authenticated but lacks permissions - redirect to access denied
    const attemptedUrl = '/' + segments.map(s => s.path).join('/');
    return router.createUrlTree(['/access-denied'], {
        queryParams: { from: attemptedUrl }
    });
};
