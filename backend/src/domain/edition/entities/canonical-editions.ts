export interface CanonicalEdition {
    code: string;
    displayName: string;
    description?: string | null;
    features: string[];
    modules: string[];
    isActive: boolean;
    sortOrder: number;
    monthlyPrice?: number | null;
    annualPrice?: number | null;
    perStudentMonthly?: number | null;
    annualPriceNotes?: string | null;
}

export const CANONICAL_EDITIONS: CanonicalEdition[] = [
    {
        code: 'free',
        displayName: 'Free',
        description: 'Basic features for small schools and platform evaluation.',
        features: [
            'Student records',
            'Attendance tracking',
            'Basic reporting',
            'Core setup tools',
        ],
        modules: ['dashboard', 'students', 'attendance', 'academics', 'setup'],
        isActive: true,
        sortOrder: 10,
        monthlyPrice: 0,
        annualPrice: 0,
        perStudentMonthly: null,
        annualPriceNotes: null,
    },
    {
        code: 'professional',
        displayName: 'Professional',
        description: 'Most features for small to medium schools with richer reporting.',
        features: [
            'Custom grading models',
            'Advanced reporting',
            'Bulk imports',
            'Library management',
            'Fee tracking',
        ],
        modules: [
            'dashboard',
            'students',
            'admissions',
            'attendance',
            'academics',
            'fees',
            'library',
            'roles',
            'tasks',
            'setup',
            'plugins',
        ],
        isActive: true,
        sortOrder: 20,
        monthlyPrice: 99,
        annualPrice: 950,
        perStudentMonthly: null,
        annualPriceNotes: null,
    },
    {
        code: 'premium',
        displayName: 'Premium',
        description: 'Advanced features for multi-school operations and larger data volumes.',
        features: [
            'Multi-school support',
            'Role-based access (RBAC)',
            'Timetables & scheduling',
            'Finance & accounting',
            'HR & transport',
        ],
        modules: [
            'dashboard',
            'students',
            'admissions',
            'attendance',
            'academics',
            'fees',
            'accounting',
            'finance',
            'hr',
            'library',
            'hostel',
            'transport',
            'roles',
            'tasks',
            'setup',
            'plugins',
        ],
        isActive: true,
        sortOrder: 30,
        monthlyPrice: 299,
        annualPrice: 2870,
        perStudentMonthly: null,
        annualPriceNotes: null,
    },
    {
        code: 'enterprise',
        displayName: 'Enterprise',
        description: 'Enterprise-grade controls for school districts and large institutions.',
        features: [
            'SSO / SAML',
            'Audit logs',
            'Custom roles & permissions',
            'Unlimited storage & records',
            '24/7 priority support',
        ],
        modules: [
            'dashboard',
            'students',
            'admissions',
            'apply',
            'attendance',
            'academics',
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
        ],
        isActive: true,
        sortOrder: 40,
        monthlyPrice: null,
        annualPrice: null,
        perStudentMonthly: null,
        annualPriceNotes: 'Custom',
    },
];

export function listCanonicalEditions(): CanonicalEdition[] {
    return [...CANONICAL_EDITIONS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCanonicalEditionByCode(code: string): CanonicalEdition | null {
    const normalized = code.trim().toLowerCase();
    return CANONICAL_EDITIONS.find((edition) => edition.code === normalized) ?? null;
}
