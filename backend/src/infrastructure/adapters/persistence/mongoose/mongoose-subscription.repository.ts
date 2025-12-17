import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from '../../../../domain/subscription/entities/subscription.entity';
import { SubscriptionRepository } from '../../../../domain/ports/out/subscription-repository.port';
import { SubscriptionDocument } from './schemas/subscription.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseSubscriptionRepository extends TenantScopedRepository<SubscriptionDocument, Subscription> implements SubscriptionRepository {
    constructor(
        @InjectModel('Subscription')
        private readonly subscriptionModel: Model<SubscriptionDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async findByTenantId(tenantId: string): Promise<Subscription | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.subscriptionModel.findOne({ tenantId: resolved }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByPlanId(planId: string): Promise<Subscription[]> {
        const docs = await this.subscriptionModel.find({ planId }).exec();
        return docs.map((d) => this.toDomain(d));
    }

    async save(subscription: Subscription): Promise<Subscription> {
        const doc = await this.subscriptionModel.findOneAndUpdate(
            { tenantId: subscription.tenantId },
            {
                plan: subscription.plan,
                planId: subscription.planId,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                billingEmail: subscription.billingEmail,
                paymentMethodLast4: subscription.paymentMethodLast4,
                paymentBrand: subscription.paymentBrand,
                invoices: subscription.invoices,
            },
            { upsert: true, new: true }
        ).exec();
        return this.toDomain(doc);
    }

    private toDomain(doc: SubscriptionDocument): Subscription {
        return new Subscription(
            doc._id.toString(),
            doc.tenantId,
            doc.planId || null,
            doc.plan as any,
            doc.status as any,
            doc.currentPeriodEnd,
            doc.billingEmail,
            doc.paymentMethodLast4,
            doc.paymentBrand,
            (doc.invoices || []).map(inv => ({
                ...inv,
                status: inv.status as 'paid' | 'open' | 'void',
            })),
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
