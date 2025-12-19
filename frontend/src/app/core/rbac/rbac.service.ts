/**
 * RBAC Service
 * 
 * Angular singleton service for role-based access control.
 * Manages user session, role definitions, and permission evaluation.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { PermissionKey, RoleDefinition, UserSession } from './permissions.types';
import { PermissionEngine } from './permission-engine';

@Injectable({
    providedIn: 'root'
})
export class RbacService {
    // Reactive state
    private readonly session$ = new BehaviorSubject<UserSession | null>(null);
    private readonly roles$ = new BehaviorSubject<RoleDefinition[]>([]);

    // Computed granted permissions (recomputed when session or roles change)
    private readonly granted$ = combineLatest([
        this.session$,
        this.roles$
    ]).pipe(
        map(([session, roles]) => PermissionEngine.buildGrantedPermissions(session, roles)),
        shareReplay(1)
    );

    // Cached latest granted set for synchronous access
    private grantedCache: Set<PermissionKey> = new Set();

    constructor() {
        // Subscribe to keep cache up to date
        this.granted$.subscribe(granted => {
            this.grantedCache = granted;
        });
    }

    /**
     * Set current user session
     * Triggers recomputation of granted permissions
     */
    setSession(session: UserSession | null): void {
        this.session$.next(session);
    }

    /**
     * Set available role definitions
     * Triggers recomputation of granted permissions
     */
    setRoles(roles: RoleDefinition[]): void {
        this.roles$.next(roles);
    }

    /**
     * Get current user session
     */
    getSession(): UserSession | null {
        return this.session$.value;
    }

    /**
     * Get current role definitions
     */
    getRoles(): RoleDefinition[] {
        return this.roles$.value;
    }

    /**
     * Check if user has a specific permission (synchronous)
     * 
     * @param permission Permission key to check
     * @returns true if granted, false otherwise (deny-by-default)
     */
    can(permission: PermissionKey): boolean {
        return PermissionEngine.can(permission, this.grantedCache);
    }

    /**
     * Check if user has ANY of the provided permissions (synchronous)
     */
    canAny(permissions: PermissionKey[]): boolean {
        return PermissionEngine.canAny(permissions, this.grantedCache);
    }

    /**
     * Check if user has ALL of the provided permissions (synchronous)
     */
    canAll(permissions: PermissionKey[]): boolean {
        return PermissionEngine.canAll(permissions, this.grantedCache);
    }

    /**
     * Observable stream of permission check results
     * Useful for reactive templates
     */
    can$(permission: PermissionKey): Observable<boolean> {
        return this.granted$.pipe(
            map(granted => PermissionEngine.can(permission, granted))
        );
    }

    /**
     * Observable stream for ANY permission check
     */
    canAny$(permissions: PermissionKey[]): Observable<boolean> {
        return this.granted$.pipe(
            map(granted => PermissionEngine.canAny(permissions, granted))
        );
    }

    /**
     * Observable stream for ALL permission check
     */
    canAll$(permissions: PermissionKey[]): Observable<boolean> {
        return this.granted$.pipe(
            map(granted => PermissionEngine.canAll(permissions, granted))
        );
    }

    /**
     * Get current granted permissions (for debugging)
     */
    grantedPermissions(): ReadonlySet<PermissionKey> {
        return this.grantedCache;
    }

    /**
     * Clear all session and roles (logout)
     */
    clear(): void {
        this.session$.next(null);
        this.roles$.next([]);
    }
}
