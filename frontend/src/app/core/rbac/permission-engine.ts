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
    private static normalize(permission: PermissionKey): PermissionKey {
        return permission.replace(/:/g, '.').trim().toLowerCase();
    }

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
        // Allow matching by id or name (case-insensitive) to tolerate payload mismatches
        const roleMapById = new Map<string, RoleDefinition>();
        const roleMapByName = new Map<string, RoleDefinition>();
        for (const role of roles) {
            if (role.id !== undefined && role.id !== null) {
                roleMapById.set(String(role.id).toLowerCase(), role);
            }
            if (role.name) {
                roleMapByName.set(String(role.name).toLowerCase(), role);
            }
        }

        for (const roleId of session.roleIds) {
            const key = String(roleId).toLowerCase();
            const role = roleMapById.get(key) || roleMapByName.get(key);
            if (role) {
                role.permissions.forEach(perm => granted.add(this.normalize(perm)));
            }
        }

        // Add explicit allow overrides if present
        if (session.permissionOverrides?.allow) {
            session.permissionOverrides.allow.forEach(perm => granted.add(this.normalize(perm)));
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
        const normalized = this.normalize(permission);
        if (granted.has(normalized)) {
            return true;
        }

        const parts = normalized.split('.');
        if (parts.length < 2) {
            return false;
        }

        const resource = parts[0];
        const action = parts.slice(1).join('.');

        // Wildcards and manage imply full access to resource
        if (granted.has(`${resource}.manage`) || granted.has(`${resource}.*`) || granted.has('*.*') || granted.has('*')) {
            return true;
        }

        // If action already contains wildcard
        if (action === '*' && granted.has(`${resource}.manage`)) {
            return true;
        }

        return false;
    }

    /**
     * Check if ANY of the provided permissions are granted
     * 
     * @param permissions Array of permission keys
     * @param granted Set of granted permissions
     * @returns true if at least one permission is granted
     */
    static canAny(permissions: PermissionKey[], granted: Set<PermissionKey>): boolean {
        return permissions.some(perm => this.can(perm, granted));
    }

    /**
     * Check if ALL of the provided permissions are granted
     * 
     * @param permissions Array of permission keys
     * @param granted Set of granted permissions
     * @returns true if all permissions are granted
     */
    static canAll(permissions: PermissionKey[], granted: Set<PermissionKey>): boolean {
        const results = permissions.every(perm => this.can(perm, granted));
        console.log('canAll check for permissions', permissions, '=>', results);
        return results;
    }
}
