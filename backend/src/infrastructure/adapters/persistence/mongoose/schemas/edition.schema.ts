import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'editions', timestamps: true })
export class EditionDocument extends Document {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    displayName: string;

    @Prop()
    description?: string;

    @Prop({ required: true, default: true })
    isActive: boolean;

    @Prop({ required: true, default: 0, min: 0 })
    sortOrder: number;

    @Prop({ required: true, default: false })
    isFallback: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const EditionSchema = SchemaFactory.createForClass(EditionDocument);
EditionSchema.index({ name: 1 }, { unique: true });
EditionSchema.index({ isFallback: 1 }, { unique: true, partialFilterExpression: { isFallback: true } });
