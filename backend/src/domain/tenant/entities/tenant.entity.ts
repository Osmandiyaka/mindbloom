export enum TenantStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    INACTIVE = 'inactive',
    DELETED = 'deleted',
}

export enum TenantPlan {
    TRIAL = 'trial',
    FREE = 'free',
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

export enum SubscriptionState {
    TRIALING = 'trialing',
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    GRACE = 'grace',
    SUSPENDED = 'suspended',
    DEACTIVATED = 'deactivated',
}

export interface EditionFeatures {
    editionCode: string;
    editionName: string;
    features: string[];
}

export enum WeekStart {
    MONDAY = 'monday',
    SUNDAY = 'sunday',
}

export interface CustomizationSettings {
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    customDomain?: string;
    emailTemplate?: string;
}

export interface AcademicYearSettings {
    start: Date;
    end: Date;
    name?: string;
}

export interface ContactInfo {
    email: string;
    phone?: string;
    alternateEmail?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export interface BillingInfo {
    stripeCustomerId?: string;
    subscriptionId?: string;
    billingEmail?: string;
    billingCycle?: 'monthly' | 'yearly';
    nextBillingDate?: Date;
    paymentMethod?: string;
    invoices?: Array<{
        id: string;
        date: Date;
        amount: number;
        status: string;
    }>;
}

export interface ResourceLimits {
    maxStudents: number;
    maxTeachers: number;
    maxClasses: number;
    maxAdmins?: number;
    maxStorage?: number;
    maxBandwidth?: number;
}

export interface ResourceUsage {
    currentStudents: number;
    currentTeachers: number;
    currentClasses: number;
    currentAdmins: number;
    currentStorage: number;
    currentBandwidth: number;
    lastCalculated?: Date;
}

export interface IdTemplateSettings {
    admissionPrefix?: string;
    admissionSeqLength?: number;
    includeYear?: boolean;
    resetPerYear?: boolean;
    rollPrefix?: string;
    rollSeqLength?: number;
    sampleClass?: string;
    sampleSection?: string;
    resetPerClass?: boolean;
}

export class Tenant {
    public static readonly FEATURE_MAP: Record<TenantPlan, string[]> = {
        [TenantPlan.TRIAL]: [
            'dashboard',
            'students',
            'admissions',
            'apply',
            'academics',
            'attendance',
            'setup',
        ],
        [TenantPlan.FREE]: [
            'dashboard',
            'students',
            'apply',
            'setup',
        ],
        [TenantPlan.BASIC]: [
            'dashboard',
            'students',
            'admissions',
            'apply',
            'academics',
            'attendance',
            'setup',
        ],
        [TenantPlan.PREMIUM]: [
            'dashboard',
            'students',
            'admissions',
            'apply',
            'academics',
            'attendance',
            'fees',
            'accounting',
            'finance',
            'library',
            'tasks',
            'setup',
            'plugins',
        ],
        [TenantPlan.ENTERPRISE]: [
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
        ],
    };

    static featuresForPlan(plan: TenantPlan): string[] {
        return [...(Tenant.FEATURE_MAP[plan] || [])];
    }

    static editionSnapshot(tenant: Tenant): EditionFeatures {
        const features = tenant.enabledModules?.length
            ? tenant.enabledModules
            : Tenant.featuresForPlan(tenant.plan);

        return {
            editionCode: tenant.plan,
            editionName: tenant.plan,
            features,
        };
    }

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly subdomain: string,
        public readonly status: TenantStatus,
        public readonly plan: TenantPlan,
        public readonly ownerId: string | null,
        public readonly contactInfo: ContactInfo,
        public readonly limits: ResourceLimits,
        public readonly usage: ResourceUsage = {
            currentStudents: 0,
            currentTeachers: 0,
            currentClasses: 0,
            currentAdmins: 0,
            currentStorage: 0,
            currentBandwidth: 0,
        },
        public readonly enabledModules: string[] = [],
        public readonly customization?: CustomizationSettings,
        public readonly billing?: BillingInfo,
        public readonly trialEndsAt?: Date,
        public readonly metadata?: Record<string, any>,
        public readonly locale: string = 'en',
        public readonly timezone: string = 'UTC',
        public readonly weekStartsOn: WeekStart = WeekStart.MONDAY,
        public readonly currency: string = 'USD',
        public readonly academicYear?: AcademicYearSettings,
        public readonly allowedIpAddresses: string[] = [],
        public readonly twoFactorRequired: boolean = false,
        public readonly ssoEnabled: boolean = false,
        public readonly ssoConfig?: Record<string, any>,
        public readonly dataRetentionDays?: number,
        public readonly lastLoginAt?: Date,
        public readonly onboardingCompletedAt?: Date,
        public readonly suspendedAt?: Date,
        public readonly suspensionReason?: string,
        public readonly deletedAt?: Date,
        public readonly statusHistory?: Array<{
            from: TenantStatus;
            to: TenantStatus;
            changedBy: string;
            changedAt: Date;
            reason?: string;
        }>,
        public readonly tags?: string[],
        public readonly idTemplates?: IdTemplateSettings,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
        public readonly editionId?: string | null,
        public readonly subscriptionEndDate?: Date,
        public readonly isSuspended: boolean = false,
        public readonly gracePeriodEndDate?: Date,
        public readonly subscriptionState: SubscriptionState = SubscriptionState.TRIALING,
        public readonly subscriptionStartDate?: Date,
        public readonly pastDueSince?: Date,
        public readonly trialEndDate?: Date,
        public readonly graceStartedAt?: Date,
        public readonly deactivatedAt?: Date,
        public readonly lastPaymentFailureAt?: Date,
        public readonly lastPaymentSuccessAt?: Date,
        public readonly lastInvoiceId?: string,
        public readonly stateVersion: number = 1,
    ) {
        if (this.subscriptionEndDate && this.gracePeriodEndDate && this.gracePeriodEndDate < this.subscriptionEndDate) {
            throw new Error('Grace period end date must be on or after subscription end date.');
        }
    }

    isActive(): boolean {
        return this.status === TenantStatus.ACTIVE && !this.isTrialExpired();
    }

    isPending(): boolean {
        return this.status === TenantStatus.PENDING;
    }

    isTrialExpired(): boolean {
        const trialEnd = this.trialEndDate || this.trialEndsAt;
        return this.plan === TenantPlan.TRIAL && !!trialEnd && trialEnd < new Date();
    }

    canAccessFeature(feature: string): boolean {
        if (this.plan === TenantPlan.ENTERPRISE) return true;
        const planFeatures = Tenant.FEATURE_MAP[this.plan] || [];
        if (!planFeatures.includes(feature)) return false;
        if (this.enabledModules.length > 0 && !this.enabledModules.includes(feature)) return false;
        return this.isActive();
    }

    subscriptionSnapshot(): {
        state: SubscriptionState;
        subscriptionEndDate?: Date;
        trialEndsAt?: Date;
        trialEndDate?: Date;
        gracePeriodEndDate?: Date;
        pastDueSince?: Date;
        isSuspended?: boolean;
        deactivatedAt?: Date;
    } {
        return {
            state: this.subscriptionState,
            subscriptionEndDate: this.subscriptionEndDate,
            trialEndsAt: this.trialEndsAt,
            trialEndDate: this.trialEndDate ?? this.trialEndsAt,
            gracePeriodEndDate: this.gracePeriodEndDate,
            pastDueSince: this.pastDueSince,
            isSuspended: this.isSuspended,
            deactivatedAt: this.deactivatedAt,
        };
    }

    isSubscriptionActive(policy: { includePastDue?: boolean; includeGrace?: boolean } = { includePastDue: true, includeGrace: true }): boolean {
        const includePastDue = policy.includePastDue !== false;
        const includeGrace = policy.includeGrace !== false;
        if (this.subscriptionState === SubscriptionState.TRIALING || this.subscriptionState === SubscriptionState.ACTIVE) {
            return true;
        }
        if (includePastDue && this.subscriptionState === SubscriptionState.PAST_DUE) {
            return true;
        }
        if (includeGrace && this.subscriptionState === SubscriptionState.GRACE) {
            return true;
        }
        return false;
    }

    hasReachedLimit(resource: 'students' | 'teachers' | 'classes' | 'storage'): boolean {
        if (!this.usage || !this.limits) return false;
        switch (resource) {
            case 'students':
                return this.limits.maxStudents >= 0 && this.usage.currentStudents >= this.limits.maxStudents;
            case 'teachers':
                return this.limits.maxTeachers >= 0 && this.usage.currentTeachers >= this.limits.maxTeachers;
            case 'classes':
                return this.limits.maxClasses >= 0 && this.usage.currentClasses >= this.limits.maxClasses;
            case 'storage':
                return !!this.limits.maxStorage && this.limits.maxStorage > 0 && this.usage.currentStorage >= this.limits.maxStorage;
            default:
                return false;
        }
    }

    getUsagePercentage(resource: 'students' | 'teachers' | 'classes'): number {
        if (!this.usage || !this.limits) return 0;
        const current = (this.usage as any)[`current${resource.charAt(0).toUpperCase()}${resource.slice(1)}`];
        const max = (this.limits as any)[`max${resource.charAt(0).toUpperCase()}${resource.slice(1)}`];
        return max > 0 ? (current / max) * 100 : 0;
    }

    requiresUpgrade(forResource?: 'students' | 'teachers' | 'classes' | 'storage'): boolean {
        if (forResource) {
            return this.hasReachedLimit(forResource);
        }
        return this.hasReachedLimit('students') ||
            this.hasReachedLimit('teachers') ||
            this.hasReachedLimit('classes') ||
            this.hasReachedLimit('storage');
    }

    static create(props: {
        name: string;
        subdomain: string;
        ownerId?: string | null;
        contactEmail: string;
        contactPhone?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
        logo?: string;
        favicon?: string;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        customDomain?: string;
        plan?: TenantPlan;
        status?: TenantStatus;
        locale?: string;
        timezone?: string;
        weekStartsOn?: WeekStart;
        currency?: string;
        metadata?: Record<string, any>;
        academicYear?: AcademicYearSettings;
        limits?: ResourceLimits;
        customization?: CustomizationSettings;
    }): Tenant {
        const plan = props.plan || TenantPlan.TRIAL;
        const status = props.status || TenantStatus.PENDING;
        const limits = props.limits || getDefaultLimitsForPlan(plan);
        return new Tenant(
            '',
            props.name,
            props.subdomain,
            status,
            plan,
            props.ownerId || null,
            {
                email: props.contactEmail,
                phone: props.contactPhone,
                address: props.address,
            },
            limits,
            {
                currentStudents: 0,
                currentTeachers: 0,
                currentClasses: 0,
                currentAdmins: 0,
                currentStorage: 0,
                currentBandwidth: 0,
            },
            [],
            props.customization || (props.logo ? { logo: props.logo } : undefined),
            undefined,
            undefined,
            props.metadata || {},
            props.locale || 'en',
            props.timezone || 'UTC',
            props.weekStartsOn || WeekStart.MONDAY,
            props.currency || 'USD',
            props.academicYear,
            [],
            false,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
    }
}

export function getDefaultLimitsForPlan(plan: TenantPlan): ResourceLimits {
    const limits = {
        [TenantPlan.TRIAL]: {
            maxStudents: 50,
            maxTeachers: 10,
            maxClasses: 5,
            maxAdmins: 2,
            maxStorage: 500,
            maxBandwidth: 5,
        },
        [TenantPlan.FREE]: {
            maxStudents: 25,
            maxTeachers: 5,
            maxClasses: 3,
            maxAdmins: 1,
            maxStorage: 100,
            maxBandwidth: 1,
        },
        [TenantPlan.BASIC]: {
            maxStudents: 200,
            maxTeachers: 30,
            maxClasses: 20,
            maxAdmins: 3,
            maxStorage: 5000,
            maxBandwidth: 50,
        },
        [TenantPlan.PREMIUM]: {
            maxStudents: 1000,
            maxTeachers: 100,
            maxClasses: 50,
            maxAdmins: 10,
            maxStorage: 20000,
            maxBandwidth: 200,
        },
        [TenantPlan.ENTERPRISE]: {
            maxStudents: -1,
            maxTeachers: -1,
            maxClasses: -1,
            maxAdmins: -1,
            maxStorage: -1,
            maxBandwidth: -1,
        },
    };
    return limits[plan] as ResourceLimits;
}
