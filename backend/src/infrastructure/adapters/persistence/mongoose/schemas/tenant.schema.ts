import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

export enum WeekStart {
    MONDAY = 'monday',
    SUNDAY = 'sunday',
}

@Schema({ _id: false })
class CustomizationSchema {
    @Prop()
    logo?: string;

    @Prop()
    favicon?: string;

    @Prop({ match: /^#[0-9A-F]{6}$/i })
    primaryColor?: string;

    @Prop({ match: /^#[0-9A-F]{6}$/i })
    secondaryColor?: string;

    @Prop({ match: /^#[0-9A-F]{6}$/i })
    accentColor?: string;

    @Prop({ unique: true, sparse: true })
    customDomain?: string;

    @Prop()
    emailTemplate?: string;
}

@Schema({ _id: false })
class AcademicYearSchema {
    @Prop({ required: true })
    start: Date;

    @Prop({ required: true })
    end: Date;

    @Prop()
    name?: string;
}

@Schema({ _id: false })
class ContactInfoSchema {
    @Prop({ required: true })
    email: string;

    @Prop()
    phone?: string;

    @Prop()
    alternateEmail?: string;

    @Prop({ type: Object })
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

@Schema({ _id: false })
class BillingInfoSchema {
    @Prop()
    stripeCustomerId?: string;

    @Prop()
    subscriptionId?: string;

    @Prop()
    billingEmail?: string;

    @Prop()
    billingCycle?: 'monthly' | 'yearly';

    @Prop()
    nextBillingDate?: Date;

    @Prop()
    paymentMethod?: string;

    @Prop({ type: [Object], default: [] })
    invoices?: Array<{
        id: string;
        date: Date;
        amount: number;
        status: string;
    }>;
}

@Schema({ _id: false })
class ResourceLimitsSchema {
    @Prop({ required: true, min: 0 })
    maxStudents: number;

    @Prop({ required: true, min: 0 })
    maxTeachers: number;

    @Prop({ required: true, min: 0 })
    maxClasses: number;

    @Prop({ min: 0 })
    maxAdmins?: number;

    @Prop({ min: 0 })
    maxStorage?: number; // MB

    @Prop({ min: 0 })
    maxBandwidth?: number; // GB/month
}

@Schema({ _id: false })
class ResourceUsageSchema {
    @Prop({ default: 0 })
    currentStudents: number;

    @Prop({ default: 0 })
    currentTeachers: number;

    @Prop({ default: 0 })
    currentClasses: number;

    @Prop({ default: 0 })
    currentAdmins: number;

    @Prop({ default: 0 })
    currentStorage: number; // MB

    @Prop({ default: 0 })
    currentBandwidth: number; // GB/month

    @Prop()
    lastCalculated?: Date;
}

@Schema({ _id: false })
class SsoConfigSchema {
    @Prop()
    provider: string;

    @Prop()
    clientId: string;

    @Prop()
    issuer: string;
}

@Schema({
    collection: 'tenants',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class TenantDocument extends Document {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    subdomain: string;

    @Prop({ required: true, enum: Object.values(TenantStatus), default: TenantStatus.PENDING })
    status: TenantStatus;

    @Prop({ required: true, enum: Object.values(TenantPlan), default: TenantPlan.TRIAL })
    plan: TenantPlan;

    @Prop()
    trialEndsAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    ownerId?: Types.ObjectId;

    @Prop({ type: ContactInfoSchema, required: true })
    contactInfo: ContactInfoSchema;

    @Prop({ type: BillingInfoSchema })
    billing?: BillingInfoSchema;

    @Prop({ type: ResourceLimitsSchema, required: true })
    limits: ResourceLimitsSchema;

    @Prop({ type: ResourceUsageSchema, default: () => ({}) })
    usage: ResourceUsageSchema;

    @Prop({ type: CustomizationSchema })
    customization?: CustomizationSchema;

    @Prop({ type: [String], default: [] })
    enabledModules: string[];

    @Prop({ default: 'en' })
    locale: string;

    @Prop({ default: 'UTC' })
    timezone: string;

    @Prop({ enum: Object.values(WeekStart), default: WeekStart.MONDAY })
    weekStartsOn: WeekStart;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ type: AcademicYearSchema })
    academicYear?: AcademicYearSchema;

    @Prop({ type: [String], default: [] })
    allowedIpAddresses?: string[];

    @Prop({ default: false })
    twoFactorRequired: boolean;

    @Prop({ default: false })
    ssoEnabled: boolean;

    @Prop({ type: SsoConfigSchema })
    ssoConfig?: SsoConfigSchema;

    @Prop()
    dataRetentionDays?: number;

    @Prop()
    lastLoginAt?: Date;

    @Prop()
    onboardingCompletedAt?: Date;

    @Prop()
    suspendedAt?: Date;

    @Prop()
    suspensionReason?: string;

    @Prop({ type: Types.ObjectId, ref: 'Edition' })
    editionId?: Types.ObjectId;

    @Prop()
    subscriptionEndDate?: Date;

    @Prop({ default: false })
    isSuspended: boolean;

    @Prop()
    gracePeriodEndDate?: Date;

    @Prop({ enum: Object.values(SubscriptionState), default: SubscriptionState.TRIALING })
    subscriptionState: SubscriptionState;

    @Prop()
    subscriptionStartDate?: Date;

    @Prop()
    pastDueSince?: Date;

    @Prop()
    graceStartedAt?: Date;

    @Prop()
    deactivatedAt?: Date;

    @Prop()
    lastPaymentFailureAt?: Date;

    @Prop()
    lastPaymentSuccessAt?: Date;

    @Prop()
    lastInvoiceId?: string;

    @Prop({ default: 1 })
    stateVersion: number;

    @Prop()
    trialEndDate?: Date;

    @Prop()
    deletedAt?: Date;

    @Prop({ type: [Object], default: [] })
    statusHistory?: Array<{
        from: TenantStatus;
        to: TenantStatus;
        changedBy: Types.ObjectId;
        changedAt: Date;
        reason?: string;
    }>;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: [String] })
    tags?: string[];

    @Prop({ type: Object })
    idTemplates?: {
        admissionPrefix?: string;
        admissionSeqLength?: number;
        includeYear?: boolean;
        resetPerYear?: boolean;
        rollPrefix?: string;
        rollSeqLength?: number;
        sampleClass?: string;
        sampleSection?: string;
        resetPerClass?: boolean;
    };

    createdAt: Date;
    updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDocument);

TenantSchema.index({ subdomain: 1 }, { unique: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ plan: 1 });
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ 'contactInfo.email': 1 });
TenantSchema.index({ createdAt: -1 });
TenantSchema.index({ deletedAt: 1 });
TenantSchema.index({ tags: 1 });
TenantSchema.index({ status: 1, plan: 1 });
TenantSchema.index({ status: 1, deletedAt: 1 });
TenantSchema.index({ 'customization.customDomain': 1 }, { unique: true, sparse: true });
TenantSchema.index({ editionId: 1 }, { sparse: true });
TenantSchema.index({ subscriptionEndDate: 1 }, { sparse: true });
TenantSchema.index({ subscriptionState: 1 });
TenantSchema.index({ pastDueSince: 1 }, { sparse: true });
TenantSchema.index({ gracePeriodEndDate: 1 }, { sparse: true });

TenantSchema.virtual('isTrialExpired').get(function () {
    return this.plan === TenantPlan.TRIAL &&
        this.trialEndsAt &&
        this.trialEndsAt < new Date();
});

TenantSchema.virtual('daysUntilTrialEnds').get(function () {
    if (!this.trialEndsAt) return null;
    const days = Math.ceil((this.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
});

TenantSchema.virtual('usagePercentage').get(function () {
    if (!this.limits || !this.usage) return {};
    return {
        students: (this.usage.currentStudents / this.limits.maxStudents) * 100,
        teachers: (this.usage.currentTeachers / this.limits.maxTeachers) * 100,
        classes: (this.usage.currentClasses / this.limits.maxClasses) * 100,
        storage: this.limits.maxStorage ?
            (this.usage.currentStorage / this.limits.maxStorage) * 100 : 0,
    };
});

TenantSchema.pre('save', function (next) {
    if (!this.limits) {
        this.limits = getDefaultLimitsForPlan(this.plan as TenantPlan);
    }
    if (this.isNew && this.plan === TenantPlan.TRIAL && !this.trialEndsAt) {
        this.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
    next();
});

function getDefaultLimitsForPlan(plan: TenantPlan): ResourceLimitsSchema {
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
    return limits[plan] as ResourceLimitsSchema;
}
