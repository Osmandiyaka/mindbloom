import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'school_entitlements', timestamps: { createdAt: false, updatedAt: true } })
export class SchoolEntitlementDocument extends Document {
    @Prop({ required: true, trim: true })
    tenantId: string;

    @Prop({ required: true, trim: true })
    moduleKey: string;

    @Prop({ required: true, default: true })
    enabled: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
    sourcePlanId: string;

    updatedAt: Date;
}

export const SchoolEntitlementSchema = SchemaFactory.createForClass(SchoolEntitlementDocument);
SchoolEntitlementSchema.index({ tenantId: 1, moduleKey: 1 }, { unique: true });
SchoolEntitlementSchema.index({ sourcePlanId: 1 });
