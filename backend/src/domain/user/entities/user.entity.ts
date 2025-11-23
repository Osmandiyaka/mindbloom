import { Permission } from '../../rbac/entities/permission.entity';

export class User {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly email: string,
        public readonly name: string,
        public readonly role: string = 'user',
        public readonly permissions: Permission[] = [],
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    isAdmin(): boolean {
        return this.role === 'admin';
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
                this.role,
                [...this.permissions, permission],
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
            this.role,
            this.permissions.filter(p => p.id !== permissionId),
            this.createdAt,
            new Date(),
        );
    }

    static create(data: {
        id?: string;
        tenantId: string;
        email: string;
        name: string;
        role?: string;
        permissions?: Permission[];
    }): User {
        return new User(
            data.id || crypto.randomUUID(),
            data.tenantId,
            data.email,
            data.name,
            data.role || 'user',
            data.permissions || [],
        );
    }
}
