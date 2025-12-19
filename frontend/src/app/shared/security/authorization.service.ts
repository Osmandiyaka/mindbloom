/**
 * Authorization Service
 * 
 * Facade service for UI-level permission checks.
 * Wraps RbacService to provide a consistent API for templates and components.
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RbacService } from '../../core/rbac/rbac.service';

export type AuthorizationMode = 'all' | 'any';

@Injectable({
    providedIn: 'root'
})
export class AuthorizationService {
    private readonly rbacService = inject(RbacService);

    /**
     * Check if user has permission(s) - Synchronous
     * 
     * @param permissions Single permission or array of permissions
     * @param mode 'all' requires ALL permissions, 'any' requires AT LEAST ONE
     * @returns true if user has required permission(s)
     */
    can(permissions: string | string[], mode: AuthorizationMode = 'all'): boolean {
        const permArray = Array.isArray(permissions) ? permissions : [permissions];

        if (permArray.length === 0) {
            return true; // No permissions required
        }

        if (mode === 'any') {
            return this.rbacService.canAny(permArray);
        } else {
            return this.rbacService.canAll(permArray);
        }
    }

    /**
     * Check if user has permission(s) - Reactive Observable
     * 
     * @param permissions Single permission or array of permissions
     * @param mode 'all' requires ALL permissions, 'any' requires AT LEAST ONE
     * @returns Observable that emits true when user has required permission(s)
     */
    can$(permissions: string | string[], mode: AuthorizationMode = 'all'): Observable<boolean> {
        const permArray = Array.isArray(permissions) ? permissions : [permissions];

        if (permArray.length === 0) {
            // No permissions required - always allow
            return new Observable(subscriber => {
                subscriber.next(true);
                subscriber.complete();
            });
        }

        if (mode === 'any') {
            return this.rbacService.canAny$(permArray);
        } else {
            return this.rbacService.canAll$(permArray);
        }
    }

    /**
     * Check multiple permission sets with different modes
     * Useful for complex authorization scenarios
     * 
     * @param checks Array of permission checks with their modes
     * @returns true if all checks pass
     */
    canMultiple(checks: Array<{ permissions: string | string[], mode?: AuthorizationMode }>): boolean {
        return checks.every(check => this.can(check.permissions, check.mode));
    }
}
