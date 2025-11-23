import { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

/**
 * Role Repository Interface (Port)
 * Infrastructure layer will implement this
 */
export interface IRoleRepository {
    /**
     * Create a new role
     */
    create(role: Role): Promise<Role>;

    /**
     * Find role by ID
     */
    findById(id: string, tenantId: string): Promise<Role | null>;

    /**
     * Find role by name
     */
    findByName(name: string, tenantId: string): Promise<Role | null>;

    /**
     * Find all roles for a tenant
     */
    findAll(tenantId: string): Promise<Role[]>;

    /**
     * Find system roles for a tenant
     */
    findSystemRoles(tenantId: string): Promise<Role[]>;

    /**
     * Find custom (non-system) roles for a tenant
     */
    findCustomRoles(tenantId: string): Promise<Role[]>;

    /**
     * Update a role
     */
    update(role: Role): Promise<Role>;

    /**
     * Delete a role
     */
    delete(id: string, tenantId: string): Promise<void>;

    /**
     * Check if role exists
     */
    exists(name: string, tenantId: string): Promise<boolean>;

    /**
     * Initialize system roles for a tenant
     */
    initializeSystemRoles(tenantId: string): Promise<Role[]>;
}
