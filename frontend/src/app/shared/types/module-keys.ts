/**
 * Module keys representing distinct feature modules in the application
 * These correspond to route groups and determine module-level access control
 */
export const MODULE_KEYS = {
    DASHBOARD: 'dashboard',
    STUDENTS: 'students',
    ADMISSIONS: 'admissions',
    APPLY: 'apply',
    ACADEMICS: 'academics',
    ATTENDANCE: 'attendance',
    FEES: 'fees',
    ACCOUNTING: 'accounting',
    FINANCE: 'finance',
    HR: 'hr',
    PAYROLL: 'payroll',
    LIBRARY: 'library',
    HOSTEL: 'hostel',
    TRANSPORT: 'transport',
    ROLES: 'roles',
    TASKS: 'tasks',
    SETUP: 'setup',
    PLUGINS: 'plugins'
} as const;

export type ModuleKey = typeof MODULE_KEYS[keyof typeof MODULE_KEYS];

/**
 * Human-readable names for modules
 */
export const MODULE_NAMES: Record<ModuleKey, string> = {
    dashboard: 'Dashboard',
    students: 'Student Management',
    admissions: 'Admissions',
    apply: 'Public Application Portal',
    academics: 'Academics',
    attendance: 'Attendance',
    fees: 'Fee Management',
    accounting: 'Accounting',
    finance: 'Finance',
    hr: 'Human Resources',
    payroll: 'Payroll',
    library: 'Library',
    hostel: 'Hostel Management',
    transport: 'Transport',
    roles: 'Roles & Permissions',
    tasks: 'Task Management',
    setup: 'Setup & Configuration',
    plugins: 'Plugins & Extensions'
};
