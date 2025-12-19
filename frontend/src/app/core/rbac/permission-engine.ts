/**
 * Permission Evaluation Engine
 * 
 * Pure, stateless engine for permission evaluation.
 * Implements deny-by-default access control with role aggregation.
 * 
 * Rules:
 * - Deny by default (no permission unless explicitly granted)
 * - Multiple roles aggregate permissions (union of all role permissions)
 * - Deterministic evaluation (same inputs always produce same output)
 */

import { PermissionKey, RoleDefinition, UserSession } from './permissions.types';

export class PermissionEngine {
    /**
     * Build set of granted permissions from user session and role definitions
     * 
     * @param session User session with role memberships
     * @param roles Available role definitions
     * @returns Set of granted permission keys (for O(1) lookup)
     */
    static buildGrantedPermissions(
        session: UserSession | null,
        roles: RoleDefinition[]
    ): Set<PermissionKey> {
        const granted = new Set<PermissionKey>();

        // No session = no permissions
        if (!session) {
            return granted;
        }

        // Aggregate permissions from all assigned roles
        const roleMap = new Map(roles.map(r => [r.id, r]));

        for (const roleId of session.roleIds) {
            const role = roleMap.get(roleId);
            if (role) {
                role.permissions.forEach(perm => granted.add(perm));
            }
        }

        // Add explicit allow overrides if present
        if (session.permissionOverrides?.allow) {
            session.permissionOverrides.allow.forEach(perm => granted.add(perm));
        }

        // Note: deny overrides not yet implemented
        // Future: remove items in session.permissionOverrides.deny from granted

        return granted;
    }

    /**
     * Check if a specific permission is granted
     * 
     * @param permission Permission key to check
     * @param granted Set of granted permissions
     * @returns true if permission is explicitly granted, false otherwise (deny-by-default)
     */
    static can(permission: PermissionKey, granted: Set<PermissionKey>): boolean {
        return granted.has(permission);
    }

    /**
     * Check if ANY of the provided permissions are granted
     * 
     * @param permissions Array of permission keys
     * @param granted Set of granted permissions
     * @returns true if at least one permission is granted
     */
    static canAny(permissions: PermissionKey[], granted: Set<PermissionKey>): boolean {
        return permissions.some(perm => granted.has(perm));
    }

    /**
     * Check if ALL of the provided permissions are granted
     * 
     * @param permissions Array of permission keys
     * @param granted Set of granted permissions
     * @returns true if all permissions are granted
     */
    static canAll(permissions: PermissionKey[], granted: Set<PermissionKey>): boolean {
        return permissions.every(perm => granted.has(perm));
    }
}
