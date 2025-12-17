import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'subscriptions', timestamps: true })
export class SubscriptionDocument extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' })
    plan: string;

    @Prop({ type: String })
    planId?: string;

    @Prop({ required: true, enum: ['active', 'past_due', 'canceled', 'trialing'], default: 'active' })
    status: string;

    @Prop({ required: true })
    currentPeriodEnd: Date;

    @Prop({ required: true })
    billingEmail: string;

    @Prop()
    paymentMethodLast4?: string;

    @Prop()
    paymentBrand?: string;

    @Prop({ type: Array, default: [] })
    invoices: Array<{
        id: string;
        amount: number;
        currency: string;
        createdAt: Date;
        description: string;
        status: string;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(SubscriptionDocument);
SubscriptionSchema.index({ tenantId: 1 }, { unique: true });
SubscriptionSchema.index({ planId: 1 });
