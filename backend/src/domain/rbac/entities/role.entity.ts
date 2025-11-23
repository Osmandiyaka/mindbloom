import { Permission } from './permission.entity';

/**
 * Role Entity - Represents a role with permissions
 */
export class Role {
    id: string;
    tenantId: string;
    name: string;
    description: string;

    /** System roles cannot be deleted or modified */
    isSystemRole: boolean;

    /** Permissions assigned to this role */
    permissions: Permission[];

    /** Parent role for permission inheritance (optional) */
    parentRoleId?: string;

    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<Role>) {
        Object.assign(this, data);
        this.permissions = this.permissions || [];
        this.isSystemRole = this.isSystemRole || false;
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = this.updatedAt || new Date();
    }

    /**
     * Check if role has a specific permission
     */
    hasPermission(resource: string, action: string): boolean {
        return this.permissions.some(
            (p) => p.resource === resource && p.allows(action as any),
        );
    }

    /**
     * Add permission to role
     */
    addPermission(permission: Permission): void {
        // Prevent duplicate permissions
        const exists = this.permissions.some(
            (p) => p.resource === permission.resource && p.scope === permission.scope,
        );

        if (!exists) {
            this.permissions.push(permission);
            this.updatedAt = new Date();
        }
    }

    /**
     * Remove permission from role
     */
    removePermission(resource: string): void {
        this.permissions = this.permissions.filter((p) => p.resource !== resource);
        this.updatedAt = new Date();
    }

    /**
     * Validate role can be modified (not a system role)
     */
    validateModifiable(): void {
        if (this.isSystemRole) {
            throw new Error(`Cannot modify system role: ${this.name}`);
        }
    }

    /**
     * Create a new role
     */
    static create(data: {
        tenantId: string;
        name: string;
        description: string;
        permissions?: Permission[];
        isSystemRole?: boolean;
    }): Role {
        return new Role({
            id: undefined, // Will be set by repository
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}
