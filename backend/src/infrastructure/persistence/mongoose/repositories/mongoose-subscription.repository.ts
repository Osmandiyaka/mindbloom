import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from '../../../../domain/subscription/entities/subscription.entity';
import { SubscriptionRepository } from '../../../../domain/subscription/ports/subscription.repository';
import { SubscriptionDocument } from '../schemas/subscription.schema';

@Injectable()
export class MongooseSubscriptionRepository implements SubscriptionRepository {
    constructor(
        @InjectModel('Subscription')
        private readonly subscriptionModel: Model<SubscriptionDocument>,
    ) { }

    async findByTenantId(tenantId: string): Promise<Subscription | null> {
        const doc = await this.subscriptionModel.findOne({ tenantId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async save(subscription: Subscription): Promise<Subscription> {
        const doc = await this.subscriptionModel.findOneAndUpdate(
            { tenantId: subscription.tenantId },
            {
                plan: subscription.plan,
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
