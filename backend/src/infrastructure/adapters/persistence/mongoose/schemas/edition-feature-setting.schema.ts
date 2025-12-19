import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'edition_feature_settings', timestamps: true })
export class EditionFeatureSettingDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Edition', required: true })
    editionId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    featureKey: string;

    @Prop({ required: true })
    value: string;

    createdAt: Date;
    updatedAt: Date;
}

export const EditionFeatureSettingSchema = SchemaFactory.createForClass(EditionFeatureSettingDocument);
EditionFeatureSettingSchema.index({ editionId: 1, featureKey: 1 }, { unique: true });
EditionFeatureSettingSchema.index({ editionId: 1 });
