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
 * Permission Entity - Represents a single permission
 * Format: {resource}:{action}:{scope}
 * Example: students:read:own, fees:create:all
 */
export class Permission {
  /** Resource this permission applies to (e.g., 'students', 'fees', 'attendance') */
  resource: string;

  /** Actions allowed on this resource */
  actions: PermissionAction[];

  /** Scope of data access */
  scope: PermissionScope;

  /** Optional conditions for fine-grained control */
  conditions?: Record<string, any>;

  constructor(data: Partial<Permission>) {
    Object.assign(this, data);
  }

  /**
   * Check if this permission allows a specific action
   */
  allows(action: PermissionAction): boolean {
    return this.actions.includes(action) || this.actions.includes(PermissionAction.MANAGE);
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
      resource,
      actions,
      scope: scope as PermissionScope,
    });
  }

  /**
   * Create a wildcard permission (full access to resource)
   */
  static wildcard(resource: string, scope: PermissionScope = PermissionScope.ALL): Permission {
    return new Permission({
      resource,
      actions: [PermissionAction.MANAGE],
      scope,
    });
  }
}
