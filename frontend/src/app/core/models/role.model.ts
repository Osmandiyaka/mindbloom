export interface Permission {
    id: string;
    resource: string;
    displayName: string;
    description?: string;
    actions: PermissionAction[];
    scope: PermissionScope;
    parentId?: string;
    children?: Permission[];
    conditions?: Record<string, any>;
    icon?: string;
    order?: number;
}

/**
 * Permission node for tree display with selection state
 */
export interface PermissionNode extends Omit<Permission, 'children'> {
    selected: boolean;
    expanded: boolean;
    indeterminate?: boolean; // For parent nodes when some children are selected
    children?: PermissionNode[];
}

export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    EXPORT = 'export',
    IMPORT = 'import',
    APPROVE = 'approve',
    MANAGE = 'manage',
}

export enum PermissionScope {
    OWN = 'own',
    DEPARTMENT = 'department',
    ALL = 'all',
}

export interface Role {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    isSystemRole: boolean;
    permissions: Permission[];
    parentRoleId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRoleDto {
    name: string;
    description: string;
    permissions: Permission[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissions?: Permission[];
}
