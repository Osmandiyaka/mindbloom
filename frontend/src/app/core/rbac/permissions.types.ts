/**
 * Core RBAC Type Definitions
 * 
 * Defines permission schema, role structure, and user session for RBAC evaluation.
 */

/**
 * Permission key - string identifier for a specific permission
 * Examples: 'students.read', 'students.write', 'fees.invoice.create'
 */
export type PermissionKey = string;

/**
 * Role definition with assigned permissions
 */
export interface RoleDefinition {
    /** Unique role identifier */
    id: string;

    /** Display name of the role */
    name: string;

    /** Optional description */
    description?: string;

    /** List of permissions granted to this role */
    permissions: PermissionKey[];

    /** Whether this is a system-defined role (cannot be deleted) */
    isSystem?: boolean;

    /** Optional priority for future conflict resolution */
    priority?: number;
}

/**
 * User session containing role memberships and optional overrides
 */
export interface UserSession {
    /** User identifier */
    userId: string;

    /** Current tenant context */
    tenantId: string;

    /** List of role IDs assigned to this user in current tenant */
    roleIds: string[];

    /**
     * Optional permission overrides (future-proof)
     * Not yet implemented in evaluation logic
     */
    permissionOverrides?: {
        /** Permissions explicitly granted beyond role permissions */
        allow?: PermissionKey[];

        /** Permissions explicitly denied (overrides role grants) */
        deny?: PermissionKey[];
    };
}
