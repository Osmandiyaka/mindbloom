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
        update: 'students.update',
        delete: 'students.delete',
        export: 'students.export'
    },
    admissions: {
        read: 'admissions.read',
        write: 'admissions.write',
        create: 'admissions.create',
        update: 'admissions.update',
        delete: 'admissions.delete'
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
    accounting: {
        read: 'accounting.read',
        write: 'accounting.write',
        approve: 'accounting.approve'
    },
    finance: {
        read: 'finance.read',
        write: 'finance.write',
        reports: 'finance.reports'
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
    hr: {
        read: 'hr.read',
        write: 'hr.write',
        create: 'hr.create',
        update: 'hr.update',
        delete: 'hr.delete'
    },
    payroll: {
        read: 'payroll.read',
        write: 'payroll.write',
        process: 'payroll.process',
        approve: 'payroll.approve'
    },
    library: {
        read: 'library.read',
        write: 'library.write',
        issue: 'library.issue',
        return: 'library.return'
    },
    hostel: {
        read: 'hostel.read',
        write: 'hostel.write',
        allocate: 'hostel.allocate'
    },
    transport: {
        read: 'transport.read',
        write: 'transport.write',
        assign: 'transport.assign'
    },
    reports: {
        view: 'reports.view',
        export: 'reports.export',
        admin: 'reports.admin'
    },
    roles: {
        read: 'roles.read',
        write: 'roles.write',
        create: 'roles.create',
        update: 'roles.update',
        delete: 'roles.delete'
    },
    setup: {
        read: 'setup.read',
        write: 'setup.write'
    },
    tasks: {
        read: 'tasks.read',
        write: 'tasks.write',
        create: 'tasks.create',
        update: 'tasks.update',
        delete: 'tasks.delete'
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
        update: 'users.update',
        delete: 'users.delete',
        impersonate: 'users.impersonate'
    }
} as const;

