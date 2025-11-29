import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    Tenant,
    TenantPlan,
    TenantStatus,
    ContactInfo,
    BillingInfo,
    ResourceLimits,
    ResourceUsage,
    CustomizationSettings,
    AcademicYearSettings,
} from '../../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository } from '../../../../domain/ports/out/tenant-repository.port';
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
            doc.plan as TenantPlan,
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
            doc.createdAt,
            doc.updatedAt,
        );
    }

    private toDocument(tenant: Tenant) {
        return {
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
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
        };
    }
}
