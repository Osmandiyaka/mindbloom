import { Permission, PermissionAction, PermissionScope } from './permission.entity';
import { Role } from './role.entity';

/**
 * Predefined System Roles
 * Now global: created once and shared across tenants
 */

export const SYSTEM_ROLE_NAMES = {
    HOST_ADMIN: 'Host Admin',
    TENANT_ADMIN: 'Tenant Admin',
    PRINCIPAL: 'Principal',
    VICE_PRINCIPAL: 'Vice Principal',
    HOD: 'Head of Department',
    TEACHER: 'Teacher',
    ACCOUNTANT: 'Accountant',
    LIBRARIAN: 'Librarian',
    PARENT: 'Parent',
    STUDENT: 'Student',
} as const;

/**
 * Global roles shared across tenants (tenantId = null)
 */
export function createGlobalRoles(): Role[] {
    return [
        // Host Admin - Full platform access (cross-tenant)
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.HOST_ADMIN,
            description: 'Platform host administrator with full access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [Permission.wildcard('*', PermissionScope.ALL)],
        }),

        // Tenant Admin - Full tenant management (global role shared, but intended for tenant-level assignment)
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.TENANT_ADMIN,
            description: 'School administrator with full tenant access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                // Full tenant access aligned to frontend permission keys (students.read, fees.write, etc.)
                Permission.wildcard('*', PermissionScope.ALL),
            ],
        }),

        // Principal - School-wide access
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.PRINCIPAL,
            description: 'Principal with school-wide access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                Permission.wildcard('students', PermissionScope.ALL),
                Permission.wildcard('staff', PermissionScope.ALL),
                Permission.wildcard('academics', PermissionScope.ALL),
                Permission.wildcard('attendance', PermissionScope.ALL),
                Permission.wildcard('exams', PermissionScope.ALL),
                Permission.wildcard('reports', PermissionScope.ALL),
                new Permission({
                    resource: 'fees',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.ALL,
                }),
            ],
        }),

        // Vice Principal
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.VICE_PRINCIPAL,
            description: 'Vice Principal with broad access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                Permission.wildcard('students', PermissionScope.ALL),
                Permission.wildcard('attendance', PermissionScope.ALL),
                Permission.wildcard('exams', PermissionScope.ALL),
                new Permission({
                    resource: 'staff',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.ALL,
                }),
            ],
        }),

        // Head of Department
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.HOD,
            description: 'Department head with department-level access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                new Permission({
                    resource: 'students',
                    actions: [PermissionAction.READ, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                }),
                new Permission({
                    resource: 'attendance',
                    actions: [PermissionAction.READ, PermissionAction.CREATE],
                    scope: PermissionScope.DEPARTMENT,
                }),
                new Permission({
                    resource: 'exams',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                }),
            ],
        }),

        // Teacher - Class-level access
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.TEACHER,
            description: 'Teacher with access to assigned classes',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                new Permission({
                    resource: 'students',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'attendance',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'grades',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'exams',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
            ],
        }),

        // Accountant - Financial access
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.ACCOUNTANT,
            description: 'Accountant with financial management access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                Permission.wildcard('fees', PermissionScope.ALL),
                Permission.wildcard('payments', PermissionScope.ALL),
                Permission.wildcard('finance', PermissionScope.ALL),
                new Permission({
                    resource: 'students',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.ALL,
                }),
                new Permission({
                    resource: 'reports',
                    actions: [PermissionAction.READ, PermissionAction.EXPORT],
                    scope: PermissionScope.ALL,
                }),
            ],
        }),

        // Librarian
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.LIBRARIAN,
            description: 'Librarian with library management access',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                Permission.wildcard('library', PermissionScope.ALL),
                new Permission({
                    resource: 'students',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.ALL,
                }),
                new Permission({
                    resource: 'staff',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.ALL,
                }),
            ],
        }),

        // Parent - Limited to own children
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.PARENT,
            description: 'Parent with access to their children\'s information',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                new Permission({
                    resource: 'students',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'attendance',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'grades',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'fees',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
            ],
        }),

        // Student - Very limited access
        new Role({
            tenantId: null,
            name: SYSTEM_ROLE_NAMES.STUDENT,
            description: 'Student with access to their own information',
            isSystemRole: true,
            isGlobal: true,
            permissions: [
                new Permission({
                    resource: 'profile',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'attendance',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'grades',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
                new Permission({
                    resource: 'library',
                    actions: [PermissionAction.READ],
                    scope: PermissionScope.OWN,
                }),
            ],
        }),
    ];
}
