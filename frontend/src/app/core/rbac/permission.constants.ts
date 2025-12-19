/**
 * Permission Constants
 * 
 * Centralized permission keys to avoid typos and provide IDE autocompletion.
 * Use these constants in code instead of raw strings.
 */

export const PERMISSIONS = {
    students: {
        read: 'students.read',
        write: 'students.write',
        create: 'students.create',
        delete: 'students.delete',
        export: 'students.export'
    },
    fees: {
        read: 'fees.read',
        write: 'fees.write',
        invoice: {
            create: 'fees.invoice.create',
            approve: 'fees.invoice.approve',
            cancel: 'fees.invoice.cancel'
        },
        payment: {
            record: 'fees.payment.record',
            refund: 'fees.payment.refund'
        }
    },
    attendance: {
        read: 'attendance.read',
        mark: 'attendance.mark',
        edit: 'attendance.edit',
        report: 'attendance.report'
    },
    academics: {
        read: 'academics.read',
        write: 'academics.write',
        grades: {
            view: 'academics.grades.view',
            edit: 'academics.grades.edit',
            publish: 'academics.grades.publish'
        }
    },
    library: {
        read: 'library.read',
        write: 'library.write',
        issue: 'library.issue',
        return: 'library.return'
    },
    reports: {
        view: 'reports.view',
        export: 'reports.export',
        admin: 'reports.admin'
    },
    settings: {
        read: 'settings.read',
        write: 'settings.write',
        system: 'settings.system'
    },
    users: {
        read: 'users.read',
        create: 'users.create',
        edit: 'users.edit',
        delete: 'users.delete',
        impersonate: 'users.impersonate'
    }
} as const;

/**
 * Mock role definitions for development
 * TODO: Replace with backend API endpoint
 */
export const MOCK_ROLES = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: [
            PERMISSIONS.students.read,
            PERMISSIONS.students.write,
            PERMISSIONS.students.create,
            PERMISSIONS.students.delete,
            PERMISSIONS.students.export,
            PERMISSIONS.fees.read,
            PERMISSIONS.fees.write,
            PERMISSIONS.fees.invoice.create,
            PERMISSIONS.fees.invoice.approve,
            PERMISSIONS.fees.invoice.cancel,
            PERMISSIONS.fees.payment.record,
            PERMISSIONS.fees.payment.refund,
            PERMISSIONS.attendance.read,
            PERMISSIONS.attendance.mark,
            PERMISSIONS.attendance.edit,
            PERMISSIONS.attendance.report,
            PERMISSIONS.academics.read,
            PERMISSIONS.academics.write,
            PERMISSIONS.academics.grades.view,
            PERMISSIONS.academics.grades.edit,
            PERMISSIONS.academics.grades.publish,
            PERMISSIONS.library.read,
            PERMISSIONS.library.write,
            PERMISSIONS.library.issue,
            PERMISSIONS.library.return,
            PERMISSIONS.reports.view,
            PERMISSIONS.reports.export,
            PERMISSIONS.reports.admin,
            PERMISSIONS.settings.read,
            PERMISSIONS.settings.write,
            PERMISSIONS.settings.system,
            PERMISSIONS.users.read,
            PERMISSIONS.users.create,
            PERMISSIONS.users.edit,
            PERMISSIONS.users.delete,
            PERMISSIONS.users.impersonate
        ],
        isSystem: true,
        priority: 100
    },
    {
        id: 'teacher',
        name: 'Teacher',
        description: 'Teaching staff with academic and attendance access',
        permissions: [
            PERMISSIONS.students.read,
            PERMISSIONS.attendance.read,
            PERMISSIONS.attendance.mark,
            PERMISSIONS.academics.read,
            PERMISSIONS.academics.write,
            PERMISSIONS.academics.grades.view,
            PERMISSIONS.academics.grades.edit,
            PERMISSIONS.library.read,
            PERMISSIONS.library.issue,
            PERMISSIONS.library.return,
            PERMISSIONS.reports.view
        ],
        isSystem: true,
        priority: 50
    },
    {
        id: 'accountant',
        name: 'Accountant',
        description: 'Financial management and fee processing',
        permissions: [
            PERMISSIONS.students.read,
            PERMISSIONS.fees.read,
            PERMISSIONS.fees.write,
            PERMISSIONS.fees.invoice.create,
            PERMISSIONS.fees.payment.record,
            PERMISSIONS.reports.view,
            PERMISSIONS.reports.export
        ],
        isSystem: true,
        priority: 50
    },
    {
        id: 'parent',
        name: 'Parent',
        description: 'View child information and make payments',
        permissions: [
            PERMISSIONS.students.read,
            PERMISSIONS.fees.read,
            PERMISSIONS.attendance.read,
            PERMISSIONS.academics.read,
            PERMISSIONS.academics.grades.view,
            PERMISSIONS.library.read
        ],
        isSystem: true,
        priority: 10
    },
    {
        id: 'student',
        name: 'Student',
        description: 'View own information',
        permissions: [
            PERMISSIONS.attendance.read,
            PERMISSIONS.academics.read,
            PERMISSIONS.academics.grades.view,
            PERMISSIONS.library.read,
            PERMISSIONS.fees.read
        ],
        isSystem: true,
        priority: 1
    }
];
