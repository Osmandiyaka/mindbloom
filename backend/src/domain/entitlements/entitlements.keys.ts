export const MODULE_KEYS = [
    'dashboard',
    'students',
    'admissions',
    'apply',
    'academics',
    'attendance',
    'fees',
    'accounting',
    'finance',
    'hr',
    'payroll',
    'library',
    'hostel',
    'transport',
    'roles',
    'tasks',
    'setup',
    'plugins',
] as const;

export type ModuleKey = typeof MODULE_KEYS[number];

export const FEATURE_KEYS = [
    'attendance.reports',
    'academics.grading.customModels',
    'academics.timetables',
    'fees.discounts',
    'security.sso.saml',
    'security.auditLogs',
    'security.customRoles',
] as const;

export type FeatureKey = typeof FEATURE_KEYS[number];
