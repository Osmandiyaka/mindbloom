/**
 * Permission Actions - CRUD + special actions
 */
export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    EXPORT = 'export',
    IMPORT = 'import',
    APPROVE = 'approve',
    MANAGE = 'manage', // Full control
}

/**
 * Permission Scope - Defines data visibility boundaries
 */
export enum PermissionScope {
    /** User can only access their own data (e.g., Teacher sees only their classes) */
    OWN = 'own',

    /** User can access department/section data (e.g., HOD sees department) */
    DEPARTMENT = 'department',

    /** User can access all tenant data (e.g., Principal sees everything) */
    ALL = 'all',
}

/**
 * Permission Entity - Represents a single permission in a tree structure
 * Each permission can have child permissions (sub-permissions)
 * Format: {resource}:{action}:{scope}
 * Example: students:read:own, students.attendance:create:all
 */
export class Permission {
    /** Unique identifier for the permission */
    id: string;

    /** Resource this permission applies to (e.g., 'students', 'fees', 'attendance') */
    resource: string;

    /** Display name for UI */
    displayName: string;

    /** Description of what this permission allows */
    description?: string;

    /** Actions allowed on this resource */
    actions: PermissionAction[];

    /** Scope of data access */
    scope: PermissionScope;

    /** Parent permission ID (null for root permissions) */
    parentId?: string;

    /** Child permissions (sub-permissions) */
    children?: Permission[];

    /** Optional conditions for fine-grained control */
    conditions?: Record<string, any>;

    /** Icon for UI display */
    icon?: string;

    /** Order for display */
    order?: number;

    constructor(data: Partial<Permission>) {
        Object.assign(this, data);
        this.children = this.children || [];
    }

    /**
     * Check if this permission allows a specific action
     */
    allows(action: PermissionAction): boolean {
        return this.actions.includes(action) || this.actions.includes(PermissionAction.MANAGE);
    }

    /**
     * Get all child permission IDs (recursive)
     */
    getAllChildIds(): string[] {
        const childIds: string[] = [];
        
        if (this.children && this.children.length > 0) {
            for (const child of this.children) {
                childIds.push(child.id);
                childIds.push(...child.getAllChildIds());
            }
        }
        
        return childIds;
    }

    /**
     * Check if this permission is a parent (has children)
     */
    isParent(): boolean {
        return this.children && this.children.length > 0;
    }

    /**
     * Find a child permission by ID (recursive)
     */
    findChildById(id: string): Permission | undefined {
        if (this.id === id) return this;
        
        if (this.children) {
            for (const child of this.children) {
                const found = child.findChildById(id);
                if (found) return found;
            }
        }
        
        return undefined;
    }

    /**
     * Add a child permission
     */
    addChild(permission: Permission): void {
        if (!this.children) {
            this.children = [];
        }
        permission.parentId = this.id;
        this.children.push(permission);
    }

    /**
     * Convert permission to string format
     * Format: resource:action:scope
     */
    toString(): string {
        const actionsStr = this.actions.join('|');
        return `${this.resource}:${actionsStr}:${this.scope}`;
    }

    /**
     * Create permission from string
     * Example: "students:read|update:own"
     */
    static fromString(permissionStr: string): Permission {
        const [resource, actionsStr, scope] = permissionStr.split(':');
        const actions = actionsStr.split('|') as PermissionAction[];

        return new Permission({
            id: resource,
            resource,
            displayName: resource,
            actions,
            scope: scope as PermissionScope,
        });
    }

    /**
     * Create a wildcard permission (full access to resource)
     */
    static wildcard(resource: string, scope: PermissionScope = PermissionScope.ALL): Permission {
        return new Permission({
            id: resource,
            resource,
            displayName: resource,
            actions: [PermissionAction.MANAGE],
            scope,
        });
    }
}
