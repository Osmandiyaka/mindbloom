export enum PlanStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum BillingInterval {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export type ModuleKey =
    | 'academics'
    | 'attendance'
    | 'fees'
    | 'finance'
    | 'hostel'
    | 'hr'
    | 'library'
    | 'payroll'
    | 'plugins'
    | 'roles'
    | 'setup'
    | 'students'
    | 'tenant'
    | 'transport'
    | 'users'
    | 'reports'
    | 'analytics';

export const MODULE_KEYS: ModuleKey[] = [
    'academics',
    'attendance',
    'fees',
    'finance',
    'hostel',
    'hr',
    'library',
    'payroll',
    'plugins',
    'roles',
    'setup',
    'students',
    'tenant',
    'transport',
    'users',
    'reports',
    'analytics',
];

export interface PlanModule {
    moduleKey: ModuleKey;
    enabled: boolean;
}

export class Plan {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly status: PlanStatus,
        public readonly currency: string,
        public readonly priceAmount: number,
        public readonly billingInterval: BillingInterval,
        public readonly modules: PlanModule[],
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }
}

export interface SchoolEntitlement {
    id: string;
    tenantId: string;
    moduleKey: ModuleKey;
    enabled: boolean;
    sourcePlanId: string;
    updatedAt?: Date;
}
