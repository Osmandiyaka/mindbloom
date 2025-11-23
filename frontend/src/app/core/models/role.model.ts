export interface Permission {
  resource: string;
  actions: PermissionAction[];
  scope: PermissionScope;
  conditions?: Record<string, any>;
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
