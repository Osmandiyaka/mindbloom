import { Permission, PermissionAction, PermissionScope } from './permission.entity';

/**
 * Comprehensive Permission Tree for the School Management System
 * Organized by modules with hierarchical sub-permissions
 */
export function createPermissionTree(): Permission[] {
    return [
        // 1. Students Module
        new Permission({
            id: 'students',
            resource: 'students',
            displayName: 'Student Management',
            description: 'Manage student information and records',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '👨‍🎓',
            order: 1,
            children: [
                new Permission({
                    id: 'students.profile',
                    resource: 'students.profile',
                    displayName: 'Student Profile',
                    description: 'View and edit student profiles',
                    actions: [PermissionAction.READ, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'students',
                    order: 1,
                }),
                new Permission({
                    id: 'students.admission',
                    resource: 'students.admission',
                    displayName: 'Student Admission',
                    description: 'Handle student admissions',
                    actions: [PermissionAction.CREATE, PermissionAction.APPROVE],
                    scope: PermissionScope.ALL,
                    parentId: 'students',
                    order: 2,
                }),
                new Permission({
                    id: 'students.documents',
                    resource: 'students.documents',
                    displayName: 'Student Documents',
                    description: 'Manage student documents',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.DELETE],
                    scope: PermissionScope.ALL,
                    parentId: 'students',
                    order: 3,
                }),
                new Permission({
                    id: 'students.attendance',
                    resource: 'students.attendance',
                    displayName: 'Student Attendance',
                    description: 'Track student attendance',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'students',
                    order: 4,
                }),
            ],
        }),

        // 2. Academics Module
        new Permission({
            id: 'academics',
            resource: 'academics',
            displayName: 'Academic Management',
            description: 'Manage academic programs and curriculum',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '📚',
            order: 2,
            children: [
                new Permission({
                    id: 'academics.classes',
                    resource: 'academics.classes',
                    displayName: 'Classes',
                    description: 'Manage class configurations',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'academics',
                    order: 1,
                }),
                new Permission({
                    id: 'academics.subjects',
                    resource: 'academics.subjects',
                    displayName: 'Subjects',
                    description: 'Manage subjects and curriculum',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'academics',
                    order: 2,
                }),
                new Permission({
                    id: 'academics.exams',
                    resource: 'academics.exams',
                    displayName: 'Examinations',
                    description: 'Manage exams and assessments',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'academics',
                    order: 3,
                }),
                new Permission({
                    id: 'academics.grades',
                    resource: 'academics.grades',
                    displayName: 'Grades & Results',
                    description: 'Manage student grades',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.OWN,
                    parentId: 'academics',
                    order: 4,
                }),
                new Permission({
                    id: 'academics.timetable',
                    resource: 'academics.timetable',
                    displayName: 'Timetable',
                    description: 'Manage class schedules',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'academics',
                    order: 5,
                }),
            ],
        }),

        // 3. Finance Module
        new Permission({
            id: 'finance',
            resource: 'finance',
            displayName: 'Finance Management',
            description: 'Manage financial operations',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '💰',
            order: 3,
            children: [
                new Permission({
                    id: 'finance.fees',
                    resource: 'finance.fees',
                    displayName: 'Fee Management',
                    description: 'Manage student fees',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'finance',
                    order: 1,
                }),
                new Permission({
                    id: 'finance.payments',
                    resource: 'finance.payments',
                    displayName: 'Payments',
                    description: 'Process fee payments',
                    actions: [PermissionAction.READ, PermissionAction.CREATE],
                    scope: PermissionScope.ALL,
                    parentId: 'finance',
                    order: 2,
                }),
                new Permission({
                    id: 'finance.expenses',
                    resource: 'finance.expenses',
                    displayName: 'Expenses',
                    description: 'Track school expenses',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
                    scope: PermissionScope.ALL,
                    parentId: 'finance',
                    order: 3,
                }),
                new Permission({
                    id: 'finance.reports',
                    resource: 'finance.reports',
                    displayName: 'Financial Reports',
                    description: 'Generate financial reports',
                    actions: [PermissionAction.READ, PermissionAction.EXPORT],
                    scope: PermissionScope.ALL,
                    parentId: 'finance',
                    order: 4,
                }),
            ],
        }),

        // 4. HR Module
        new Permission({
            id: 'hr',
            resource: 'hr',
            displayName: 'Human Resources',
            description: 'Manage staff and HR operations',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '👥',
            order: 4,
            children: [
                new Permission({
                    id: 'hr.staff',
                    resource: 'hr.staff',
                    displayName: 'Staff Management',
                    description: 'Manage staff information',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'hr',
                    order: 1,
                }),
                new Permission({
                    id: 'hr.payroll',
                    resource: 'hr.payroll',
                    displayName: 'Payroll',
                    description: 'Process staff payroll',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
                    scope: PermissionScope.ALL,
                    parentId: 'hr',
                    order: 2,
                }),
                new Permission({
                    id: 'hr.attendance',
                    resource: 'hr.attendance',
                    displayName: 'Staff Attendance',
                    description: 'Track staff attendance',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'hr',
                    order: 3,
                }),
                new Permission({
                    id: 'hr.leave',
                    resource: 'hr.leave',
                    displayName: 'Leave Management',
                    description: 'Manage staff leave requests',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'hr',
                    order: 4,
                }),
            ],
        }),

        // 5. Library Module
        new Permission({
            id: 'library',
            resource: 'library',
            displayName: 'Library Management',
            description: 'Manage library resources',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '📖',
            order: 5,
            children: [
                new Permission({
                    id: 'library.books',
                    resource: 'library.books',
                    displayName: 'Books & Resources',
                    description: 'Manage library books',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'library',
                    order: 1,
                }),
                new Permission({
                    id: 'library.issue',
                    resource: 'library.issue',
                    displayName: 'Issue/Return',
                    description: 'Issue and return books',
                    actions: [PermissionAction.READ, PermissionAction.CREATE],
                    scope: PermissionScope.ALL,
                    parentId: 'library',
                    order: 2,
                }),
            ],
        }),

        // 6. Transport Module
        new Permission({
            id: 'transport',
            resource: 'transport',
            displayName: 'Transport Management',
            description: 'Manage school transport',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '🚌',
            order: 6,
            children: [
                new Permission({
                    id: 'transport.routes',
                    resource: 'transport.routes',
                    displayName: 'Routes',
                    description: 'Manage transport routes',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'transport',
                    order: 1,
                }),
                new Permission({
                    id: 'transport.vehicles',
                    resource: 'transport.vehicles',
                    displayName: 'Vehicles',
                    description: 'Manage vehicles',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'transport',
                    order: 2,
                }),
            ],
        }),

        // 7. Hostel Module
        new Permission({
            id: 'hostel',
            resource: 'hostel',
            displayName: 'Hostel Management',
            description: 'Manage hostel operations',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '🏠',
            order: 7,
            children: [
                new Permission({
                    id: 'hostel.rooms',
                    resource: 'hostel.rooms',
                    displayName: 'Room Management',
                    description: 'Manage hostel rooms',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'hostel',
                    order: 1,
                }),
                new Permission({
                    id: 'hostel.allocation',
                    resource: 'hostel.allocation',
                    displayName: 'Room Allocation',
                    description: 'Allocate rooms to students',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'hostel',
                    order: 2,
                }),
            ],
        }),

        // 8. Communication Module
        new Permission({
            id: 'communication',
            resource: 'communication',
            displayName: 'Communication',
            description: 'Manage communications',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '✉️',
            order: 8,
            children: [
                new Permission({
                    id: 'communication.announcements',
                    resource: 'communication.announcements',
                    displayName: 'Announcements',
                    description: 'Create and manage announcements',
                    actions: [PermissionAction.READ, PermissionAction.CREATE],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'communication',
                    order: 1,
                }),
                new Permission({
                    id: 'communication.messages',
                    resource: 'communication.messages',
                    displayName: 'Messages',
                    description: 'Send messages to users',
                    actions: [PermissionAction.READ, PermissionAction.CREATE],
                    scope: PermissionScope.OWN,
                    parentId: 'communication',
                    order: 2,
                }),
            ],
        }),

        // 9. Reports Module
        new Permission({
            id: 'reports',
            resource: 'reports',
            displayName: 'Reports & Analytics',
            description: 'Generate and view reports',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '📊',
            order: 9,
            children: [
                new Permission({
                    id: 'reports.academic',
                    resource: 'reports.academic',
                    displayName: 'Academic Reports',
                    description: 'Generate academic reports',
                    actions: [PermissionAction.READ, PermissionAction.EXPORT],
                    scope: PermissionScope.DEPARTMENT,
                    parentId: 'reports',
                    order: 1,
                }),
                new Permission({
                    id: 'reports.financial',
                    resource: 'reports.financial',
                    displayName: 'Financial Reports',
                    description: 'Generate financial reports',
                    actions: [PermissionAction.READ, PermissionAction.EXPORT],
                    scope: PermissionScope.ALL,
                    parentId: 'reports',
                    order: 2,
                }),
            ],
        }),

        // 10. System Settings
        new Permission({
            id: 'system',
            resource: 'system',
            displayName: 'System Settings',
            description: 'Manage system configuration',
            actions: [PermissionAction.MANAGE],
            scope: PermissionScope.ALL,
            icon: '⚙️',
            order: 10,
            children: [
                new Permission({
                    id: 'system.roles',
                    resource: 'system.roles',
                    displayName: 'Roles & Permissions',
                    description: 'Manage roles and permissions',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE],
                    scope: PermissionScope.ALL,
                    parentId: 'system',
                    order: 1,
                }),
                new Permission({
                    id: 'system.users',
                    resource: 'system.users',
                    displayName: 'User Management',
                    description: 'Manage system users',
                    actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE],
                    scope: PermissionScope.ALL,
                    parentId: 'system',
                    order: 2,
                }),
                new Permission({
                    id: 'system.settings',
                    resource: 'system.settings',
                    displayName: 'General Settings',
                    description: 'Configure system settings',
                    actions: [PermissionAction.READ, PermissionAction.UPDATE],
                    scope: PermissionScope.ALL,
                    parentId: 'system',
                    order: 3,
                }),
            ],
        }),
    ];
}

/**
 * Get permission tree as a flat array with parent-child relationships
 */
export function getFlatPermissionList(): Permission[] {
    const tree = createPermissionTree();
    const flatList: Permission[] = [];

    function flatten(permissions: Permission[]) {
        for (const permission of permissions) {
            flatList.push(permission);
            if (permission.children && permission.children.length > 0) {
                flatten(permission.children);
            }
        }
    }

    flatten(tree);
    return flatList;
}
