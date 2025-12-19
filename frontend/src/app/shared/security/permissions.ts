/**
 * Permission Constants
 * 
 * Centralized permission definitions to avoid typos and provide IDE autocomplete.
 * Use these constants in templates and code instead of raw strings.
 * 
 * Convention: module.action format (e.g., 'students.read', 'students.write')
 */

export const PERMS = {
    // Students
    STUDENTS_READ: 'students.read',
    STUDENTS_WRITE: 'students.write',
    STUDENTS_CREATE: 'students.create',
    STUDENTS_UPDATE: 'students.update',
    STUDENTS_DELETE: 'students.delete',
    STUDENTS_EXPORT: 'students.export',

    // Admissions
    ADMISSIONS_READ: 'admissions.read',
    ADMISSIONS_WRITE: 'admissions.write',
    ADMISSIONS_CREATE: 'admissions.create',
    ADMISSIONS_UPDATE: 'admissions.update',
    ADMISSIONS_DELETE: 'admissions.delete',

    // Academics
    ACADEMICS_READ: 'academics.read',
    ACADEMICS_WRITE: 'academics.write',
    ACADEMICS_GRADES_VIEW: 'academics.grades.view',
    ACADEMICS_GRADES_EDIT: 'academics.grades.edit',
    ACADEMICS_GRADES_PUBLISH: 'academics.grades.publish',

    // Attendance
    ATTENDANCE_READ: 'attendance.read',
    ATTENDANCE_MARK: 'attendance.mark',
    ATTENDANCE_EDIT: 'attendance.edit',
    ATTENDANCE_REPORT: 'attendance.report',

    // Fees
    FEES_READ: 'fees.read',
    FEES_WRITE: 'fees.write',
    FEES_INVOICE_CREATE: 'fees.invoice.create',
    FEES_INVOICE_APPROVE: 'fees.invoice.approve',
    FEES_INVOICE_CANCEL: 'fees.invoice.cancel',
    FEES_PAYMENT_RECORD: 'fees.payment.record',
    FEES_PAYMENT_REFUND: 'fees.payment.refund',

    // Accounting
    ACCOUNTING_READ: 'accounting.read',
    ACCOUNTING_WRITE: 'accounting.write',
    ACCOUNTING_APPROVE: 'accounting.approve',

    // Finance
    FINANCE_READ: 'finance.read',
    FINANCE_WRITE: 'finance.write',
    FINANCE_REPORTS: 'finance.reports',

    // HR
    HR_READ: 'hr.read',
    HR_WRITE: 'hr.write',
    HR_CREATE: 'hr.create',
    HR_UPDATE: 'hr.update',
    HR_DELETE: 'hr.delete',

    // Payroll
    PAYROLL_READ: 'payroll.read',
    PAYROLL_WRITE: 'payroll.write',
    PAYROLL_PROCESS: 'payroll.process',
    PAYROLL_APPROVE: 'payroll.approve',

    // Library
    LIBRARY_READ: 'library.read',
    LIBRARY_WRITE: 'library.write',
    LIBRARY_ISSUE: 'library.issue',
    LIBRARY_RETURN: 'library.return',

    // Hostel
    HOSTEL_READ: 'hostel.read',
    HOSTEL_WRITE: 'hostel.write',
    HOSTEL_ALLOCATE: 'hostel.allocate',

    // Transport
    TRANSPORT_READ: 'transport.read',
    TRANSPORT_WRITE: 'transport.write',
    TRANSPORT_ASSIGN: 'transport.assign',

    // Roles & Permissions
    ROLES_READ: 'roles.read',
    ROLES_WRITE: 'roles.write',
    ROLES_CREATE: 'roles.create',
    ROLES_UPDATE: 'roles.update',
    ROLES_DELETE: 'roles.delete',

    // Setup
    SETUP_READ: 'setup.read',
    SETUP_WRITE: 'setup.write',

    // Tasks
    TASKS_READ: 'tasks.read',
    TASKS_WRITE: 'tasks.write',
    TASKS_CREATE: 'tasks.create',
    TASKS_UPDATE: 'tasks.update',
    TASKS_DELETE: 'tasks.delete',

    // Reports
    REPORTS_VIEW: 'reports.view',
    REPORTS_EXPORT: 'reports.export',
    REPORTS_ADMIN: 'reports.admin',

    // Settings
    SETTINGS_READ: 'settings.read',
    SETTINGS_WRITE: 'settings.write',
    SETTINGS_SYSTEM: 'settings.system',

    // Users
    USERS_READ: 'users.read',
    USERS_CREATE: 'users.create',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_IMPERSONATE: 'users.impersonate'
} as const;

/**
 * Permission type derived from PERMS constant
 */
export type Permission = typeof PERMS[keyof typeof PERMS];
