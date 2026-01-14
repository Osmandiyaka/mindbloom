import { FEATURE_KEYS, MODULE_KEYS, type FeatureKey, type ModuleKey } from './entitlements.keys';

export type EditionCode = 'free' | 'professional' | 'premium' | 'enterprise';

export interface EditionPricing {
    monthlyPrice?: number | null;
    annualPrice?: number | null;
    perStudentMonthly?: number | null;
    annualPriceNotes?: string | null;
}

export interface EditionLimits {
    maxSchools?: number | null;
    maxUsers?: number | null;
    maxStudents?: number | null;
}

export interface CanonicalEditionDefinition {
    code: EditionCode;
    displayName: string;
    description?: string | null;
    marketingHighlights: string[];
    modules: ModuleKey[];
    features: FeatureKey[];
    isActive: boolean;
    sortOrder: number;
    pricing?: EditionPricing;
    limits?: EditionLimits;
    version: number;
}

export const CANONICAL_EDITIONS: readonly CanonicalEditionDefinition[] = [
    {
        code: 'free',
        displayName: 'Free',
        description: 'Basic features for small schools and platform evaluation.',
        marketingHighlights: [
            'Student records',
            'Attendance tracking',
            'Basic reporting',
            'Core setup tools',
        ],
        modules: ['dashboard', 'students', 'attendance', 'academics', 'setup'],
        features: ['attendance.reports'],
        isActive: true,
        sortOrder: 10,
        pricing: { monthlyPrice: 0, annualPrice: 0, perStudentMonthly: null, annualPriceNotes: null },
        limits: { maxSchools: 1 },
        version: 1,
    },
    {
        code: 'professional',
        displayName: 'Professional',
        description: 'Most features for small to medium schools with richer reporting.',
        marketingHighlights: [
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
        features: ['academics.grading.customModels'],
        isActive: true,
        sortOrder: 20,
        pricing: { monthlyPrice: 99, annualPrice: 950, perStudentMonthly: null, annualPriceNotes: null },
        limits: { maxSchools: 3 },
        version: 1,
    },
    {
        code: 'premium',
        displayName: 'Premium',
        description: 'Advanced features for multi-school operations and larger data volumes.',
        marketingHighlights: [
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
        features: [
            'academics.timetables',
            'academics.grading.customModels',
            'fees.discounts',
        ],
        isActive: true,
        sortOrder: 30,
        pricing: { monthlyPrice: 299, annualPrice: 2870, perStudentMonthly: null, annualPriceNotes: null },
        limits: { maxSchools: 20 },
        version: 1,
    },
    {
        code: 'enterprise',
        displayName: 'Enterprise',
        description: 'Enterprise-grade controls for school districts and large institutions.',
        marketingHighlights: [
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
        features: [
            'security.sso.saml',
            'security.auditLogs',
            'security.customRoles',
            'academics.timetables',
        ],
        isActive: true,
        sortOrder: 40,
        pricing: { monthlyPrice: null, annualPrice: null, perStudentMonthly: null, annualPriceNotes: 'Custom' },
        limits: { maxSchools: null, maxUsers: null, maxStudents: null },
        version: 1,
    },
] as const;

export function listCanonicalEditions(): CanonicalEditionDefinition[] {
    return [...CANONICAL_EDITIONS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCanonicalEditionByCode(code: string): CanonicalEditionDefinition | null {
    const normalized = code.trim().toLowerCase();
    return CANONICAL_EDITIONS.find((edition) => edition.code === normalized) ?? null;
}

export function validateEntitlementsRegistry(): void {
    const codes = new Set<string>();
    const moduleSet = new Set<string>(MODULE_KEYS);
    const featureSet = new Set<string>(FEATURE_KEYS);

    for (const edition of CANONICAL_EDITIONS) {
        if (codes.has(edition.code)) {
            throw new Error(`Duplicate edition code: ${edition.code}`);
        }
        codes.add(edition.code);

        if (!edition.displayName?.trim()) {
            throw new Error(`Edition displayName missing for ${edition.code}`);
        }
        if (edition.sortOrder < 0) {
            throw new Error(`Edition sortOrder must be >= 0 for ${edition.code}`);
        }
        if (edition.version <= 0) {
            throw new Error(`Edition version must be >= 1 for ${edition.code}`);
        }

        for (const moduleKey of edition.modules) {
            if (!moduleSet.has(moduleKey)) {
                throw new Error(`Unknown module key "${moduleKey}" in edition ${edition.code}`);
            }
        }
        for (const featureKey of edition.features) {
            if (!featureSet.has(featureKey)) {
                throw new Error(`Unknown feature key "${featureKey}" in edition ${edition.code}`);
            }
        }

        const pricing = edition.pricing;
        if (pricing) {
            if (pricing.monthlyPrice !== undefined && pricing.monthlyPrice !== null && pricing.monthlyPrice < 0) {
                throw new Error(`monthlyPrice must be >= 0 for ${edition.code}`);
            }
            if (pricing.annualPrice !== undefined && pricing.annualPrice !== null && pricing.annualPrice < 0) {
                throw new Error(`annualPrice must be >= 0 for ${edition.code}`);
            }
            if (pricing.perStudentMonthly !== undefined && pricing.perStudentMonthly !== null && pricing.perStudentMonthly < 0) {
                throw new Error(`perStudentMonthly must be >= 0 for ${edition.code}`);
            }
        }
    }
}
