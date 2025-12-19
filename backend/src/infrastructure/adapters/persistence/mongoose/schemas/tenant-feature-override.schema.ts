import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'tenant_feature_overrides', timestamps: true })
export class TenantFeatureOverrideDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    featureKey: string;

    @Prop({ required: true })
    value: string;

    createdAt: Date;
    updatedAt: Date;
}

export const TenantFeatureOverrideSchema = SchemaFactory.createForClass(TenantFeatureOverrideDocument);
TenantFeatureOverrideSchema.index({ tenantId: 1, featureKey: 1 }, { unique: true });
TenantFeatureOverrideSchema.index({ tenantId: 1 });
