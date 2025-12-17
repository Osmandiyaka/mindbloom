import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { BillingInterval, PlanStatus } from '../../../../../domain/subscription/entities/plan.entity';

@Schema({ collection: 'plans', timestamps: true })
export class PlanDocument extends Document {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ required: true, enum: Object.values(PlanStatus), default: PlanStatus.ACTIVE })
    status: PlanStatus;

    @Prop({ required: true, trim: true, default: 'USD' })
    currency: string;

    @Prop({ required: true, min: 0 })
    priceAmount: number;

    @Prop({ required: true, enum: Object.values(BillingInterval), default: BillingInterval.MONTHLY })
    billingInterval: BillingInterval;

    createdAt: Date;
    updatedAt: Date;
}

export const PlanSchema = SchemaFactory.createForClass(PlanDocument);
PlanSchema.index({ name: 1 }, { unique: true });

@Schema({ collection: 'plan_modules', timestamps: true })
export class PlanModuleDocument extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    moduleKey: string;

    @Prop({ required: true, default: true })
    enabled: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const PlanModuleSchema = SchemaFactory.createForClass(PlanModuleDocument);
PlanModuleSchema.index({ planId: 1, moduleKey: 1 }, { unique: true });
