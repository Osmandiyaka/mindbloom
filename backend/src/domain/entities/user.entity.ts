import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../rbac/entities/role.entity';

export class User {
    constructor(
        public readonly id: string,
        public readonly tenantId: string | null,
        public readonly email: string,
        public readonly name: string,
        public readonly roleId: string | null = null,
        public readonly role: Role | null = null,
        public readonly permissions: Permission[] = [],
        public readonly profilePicture: string | null = null,
        public readonly forcePasswordReset: boolean = false,
        public readonly mfaEnabled: boolean = false,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    isAdmin(): boolean {
        return this.role?.name === 'Tenant Admin' || this.role?.name === 'Host Admin';
    }

    /**
     * Check if user has a specific permission through their role
     */
    hasRolePermission(resource: string, action: string): boolean {
        if (!this.role) {
            return false;
        }
        return this.role.hasPermission(resource, action);
    }

    /**
     * Check if user has a specific permission (directly assigned)
     */
    hasPermission(permissionId: string): boolean {
        return this.permissions.some(p => p.id === permissionId);
    }

    /**
     * Add a permission to user
     */
    addPermission(permission: Permission): User {
        if (!this.hasPermission(permission.id)) {
            return new User(
                this.id,
                this.tenantId,
                this.email,
                this.name,
                this.roleId,
                this.role,
                [...this.permissions, permission],
                this.profilePicture,
                this.forcePasswordReset,
                this.mfaEnabled,
                this.createdAt,
                new Date(),
            );
        }
        return this;
    }

    /**
     * Remove a permission from user
     */
    removePermission(permissionId: string): User {
        return new User(
            this.id,
            this.tenantId,
            this.email,
            this.name,
            this.roleId,
            this.role,
            this.permissions.filter(p => p.id !== permissionId),
            this.profilePicture,
            this.forcePasswordReset,
            this.mfaEnabled,
            this.createdAt,
            new Date(),
        );
    }

    static create(data: {
        id?: string;
        tenantId?: string | null;
        email: string;
        name: string;
        roleId?: string | null;
        role?: Role | null;
        permissions?: Permission[];
        profilePicture?: string | null;
        forcePasswordReset?: boolean;
        mfaEnabled?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }): User {
        return new User(
            data.id || crypto.randomUUID(),
            data.tenantId ?? null,
            data.email,
            data.name,
            data.roleId || null,
            data.role || null,
            data.permissions || [],
            data.profilePicture || null,
            data.forcePasswordReset ?? false,
            data.mfaEnabled ?? false,
            data.createdAt || new Date(),
            data.updatedAt || new Date(),
        );
    }
}
