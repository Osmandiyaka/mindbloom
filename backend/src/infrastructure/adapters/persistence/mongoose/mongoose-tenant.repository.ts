import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    Tenant,
    TenantStatus,
    ContactInfo,
    BillingInfo,
    ResourceLimits,
    ResourceUsage,
    CustomizationSettings,
    AcademicYearSettings,
    SubscriptionState,
    ExpirationPolicyOverride,
} from '../../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../../../domain/ports/out/tenant-repository.port';
import { TenantDocument } from './schemas/tenant.schema';

@Injectable()
export class MongooseTenantRepository implements ITenantRepository {
    constructor(
        @InjectModel('Tenant')
        private readonly tenantModel: Model<TenantDocument>,
    ) { }

    async findAll(): Promise<Tenant[]> {
        const tenants = await this.tenantModel.find().exec();
        return tenants.map((t) => this.toDomain(t));
    }

    async findById(id: string): Promise<Tenant | null> {
        const tenant = await this.tenantModel.findById(id).exec();
        return tenant ? this.toDomain(tenant) : null;
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        const tenant = await this.tenantModel.findOne({ subdomain }).exec();
        return tenant ? this.toDomain(tenant) : null;
    }

    async findByCustomDomain(customDomain: string): Promise<Tenant | null> {
        const tenant = await this.tenantModel.findOne({ 'customization.customDomain': customDomain }).exec();
        return tenant ? this.toDomain(tenant) : null;
    }

    async findWithFilters(query: TenantListQuery): Promise<TenantListResult> {
        const filter: Record<string, any> = {};

        if (query.statuses && query.statuses.length > 0) {
            filter.status = { $in: query.statuses };
        }

        if (query.editions && query.editions.length > 0) {
            filter.editionId = { $in: query.editions };
        }

        if (query.trialExpiringBefore) {
            filter.trialEndsAt = { $lte: query.trialExpiringBefore };
        }

        if (query.subscriptionStates && query.subscriptionStates.length > 0) {
            filter.subscriptionState = { $in: query.subscriptionStates };
        }

        const subscriptionEndFilter: Record<string, any> = {};
        if (query.subscriptionEndDateBefore) subscriptionEndFilter.$lte = query.subscriptionEndDateBefore;
        if (query.subscriptionEndDateAfter) subscriptionEndFilter.$gte = query.subscriptionEndDateAfter;
        if (Object.keys(subscriptionEndFilter).length > 0) {
            filter.subscriptionEndDate = subscriptionEndFilter;
        }

        const graceEndFilter: Record<string, any> = {};
        if (query.gracePeriodEndDateBefore) graceEndFilter.$lte = query.gracePeriodEndDateBefore;
        if (query.gracePeriodEndDateAfter) graceEndFilter.$gte = query.gracePeriodEndDateAfter;
        if (Object.keys(graceEndFilter).length > 0) {
            filter.gracePeriodEndDate = graceEndFilter;
        }

        const pastDueFilter: Record<string, any> = {};
        if (query.pastDueSinceBefore) pastDueFilter.$lte = query.pastDueSinceBefore;
        if (query.pastDueSinceAfter) pastDueFilter.$gte = query.pastDueSinceAfter;
        if (Object.keys(pastDueFilter).length > 0) {
            filter.pastDueSince = pastDueFilter;
        }

        if (query.search && query.search.trim()) {
            const regex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { name: regex },
                { subdomain: regex },
                { 'contactInfo.email': regex },
                { 'customization.customDomain': regex },
            ];
        }

        const page = Math.max(query.page || 1, 1);
        const pageSize = Math.min(Math.max(query.pageSize || 20, 1), 100);
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortDirection === 'asc' ? 1 : -1;
        const trialCutoff = query.trialExpiringBefore || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const [docs, total, usageAgg, statusAgg] = await Promise.all([
            this.tenantModel
                .find(filter)
                .sort({ [sortField]: sortDirection })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .exec(),
            this.tenantModel.countDocuments(filter),
            this.tenantModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        students: { $sum: '$usage.currentStudents' },
                        teachers: { $sum: '$usage.currentTeachers' },
                        classes: { $sum: '$usage.currentClasses' },
                        storageMb: { $sum: '$usage.currentStorage' },
                    },
                },
            ]),
            this.tenantModel.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        active: { $sum: { $cond: [{ $eq: ['$status', TenantStatus.ACTIVE] }, 1, 0] } },
                        suspended: { $sum: { $cond: [{ $eq: ['$status', TenantStatus.SUSPENDED] }, 1, 0] } },
                        trial: { $sum: { $cond: [{ $eq: ['$edition', 'trial'] }, 1, 0] } },
                        trialExpiring: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$edition', 'trial'] },
                                            { $lte: ['$trialEndsAt', trialCutoff] },
                                        ]
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        const usageTotals = usageAgg?.[0] ? {
            students: usageAgg[0].students || 0,
            teachers: usageAgg[0].teachers || 0,
            classes: usageAgg[0].classes || 0,
            storageMb: usageAgg[0].storageMb || 0,
        } : {
            students: 0,
            teachers: 0,
            classes: 0,
            storageMb: 0,
        };

        const statusCounts = statusAgg?.[0] ? {
            active: statusAgg[0].active || 0,
            suspended: statusAgg[0].suspended || 0,
            trial: statusAgg[0].trial || 0,
            trialExpiring: statusAgg[0].trialExpiring || 0,
        } : {
            active: 0,
            suspended: 0,
            trial: 0,
            trialExpiring: 0,
        };

        return {
            data: docs.map((d) => this.toDomain(d)),
            total,
            page,
            pageSize,
            usageTotals,
            statusCounts,
        };
    }

    async create(tenant: Tenant): Promise<Tenant> {
        const created = await this.tenantModel.create(this.toDocument(tenant));
        return this.toDomain(created);
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const updated = await this.tenantModel
            .findByIdAndUpdate(id, this.toDocument(data as Tenant), { new: true })
            .exec();

        if (!updated) {
            throw new Error(`Tenant with id ${id} not found`);
        }

        return this.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.tenantModel.findByIdAndDelete(id).exec();
    }

    private toDomain(doc: TenantDocument): Tenant {
        return new Tenant(
            doc._id.toString(),
            doc.name,
            doc.subdomain,
            doc.status as TenantStatus,
            doc.ownerId ? doc.ownerId.toString() : null,
            doc.contactInfo as ContactInfo,
            doc.limits as ResourceLimits,
            doc.usage as ResourceUsage,
            doc.enabledModules || [],
            doc.customization as CustomizationSettings,
            doc.billing as BillingInfo,
            doc.trialEndsAt,
            doc.metadata || {},
            doc.locale,
            doc.timezone,
            doc.weekStartsOn as any,
            doc.currency,
            doc.academicYear as AcademicYearSettings,
            doc.allowedIpAddresses || [],
            doc.twoFactorRequired,
            doc.ssoEnabled,
            doc.ssoConfig,
            doc.dataRetentionDays,
            doc.lastLoginAt,
            doc.onboardingCompletedAt,
            doc.suspendedAt,
            doc.suspensionReason,
            doc.deletedAt,
            doc.statusHistory as any,
            doc.tags,
            doc.idTemplates,
            doc.createdAt,
            doc.updatedAt,
            doc.editionId ? doc.editionId.toString() : null,
            doc.subscriptionEndDate,
            doc.isSuspended ?? false,
            doc.gracePeriodEndDate,
            doc.subscriptionState as SubscriptionState,
            doc.subscriptionStartDate,
            doc.pastDueSince,
            doc.trialEndDate,
            doc.graceStartedAt,
            doc.deactivatedAt,
            doc.lastPaymentFailureAt,
            doc.lastPaymentSuccessAt,
            doc.lastInvoiceId,
            doc.stateVersion ?? 1,
            doc.expirationPolicy as ExpirationPolicyOverride,
        );
    }

    private toDocument(tenant: Partial<Tenant>) {
        const doc: Record<string, any> = {
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            ownerId: tenant.ownerId,
            contactInfo: tenant.contactInfo,
            billing: tenant.billing,
            limits: tenant.limits,
            usage: tenant.usage,
            customization: tenant.customization,
            enabledModules: tenant.enabledModules,
            locale: tenant.locale,
            timezone: tenant.timezone,
            weekStartsOn: tenant.weekStartsOn,
            currency: tenant.currency,
            academicYear: tenant.academicYear as AcademicYearSettings,
            allowedIpAddresses: tenant.allowedIpAddresses,
            twoFactorRequired: tenant.twoFactorRequired,
            ssoEnabled: tenant.ssoEnabled,
            ssoConfig: tenant.ssoConfig,
            dataRetentionDays: tenant.dataRetentionDays,
            lastLoginAt: tenant.lastLoginAt,
            onboardingCompletedAt: tenant.onboardingCompletedAt,
            suspendedAt: tenant.suspendedAt,
            suspensionReason: tenant.suspensionReason,
            deletedAt: tenant.deletedAt,
            statusHistory: tenant.statusHistory,
            metadata: tenant.metadata,
            tags: tenant.tags,
            trialEndsAt: tenant.trialEndsAt,
            idTemplates: tenant.idTemplates,
            // Persist editionId (preferred).
            editionId: tenant.editionId,
            subscriptionEndDate: tenant.subscriptionEndDate,
            isSuspended: tenant.isSuspended,
            gracePeriodEndDate: tenant.gracePeriodEndDate,
            subscriptionState: tenant.subscriptionState,
            subscriptionStartDate: tenant.subscriptionStartDate,
            pastDueSince: tenant.pastDueSince,
            trialEndDate: tenant.trialEndDate,
            graceStartedAt: tenant.graceStartedAt,
            deactivatedAt: tenant.deactivatedAt,
            lastPaymentFailureAt: tenant.lastPaymentFailureAt,
            lastPaymentSuccessAt: tenant.lastPaymentSuccessAt,
            lastInvoiceId: tenant.lastInvoiceId,
            stateVersion: tenant.stateVersion,
            expirationPolicy: tenant.expirationPolicy,
        };

        Object.keys(doc).forEach((key) => doc[key] === undefined && delete doc[key]);
        return doc;
    }
}
