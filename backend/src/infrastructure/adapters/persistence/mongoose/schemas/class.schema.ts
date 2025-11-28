import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'classes', timestamps: true })
export class ClassDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    grade: string;

    @Prop({ required: true })
    section: string;

    @Prop()
    capacity?: number;

    @Prop()
    teacherId?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const ClassSchema = SchemaFactory.createForClass(ClassDocument);

// Add compound index for tenant-based queries
ClassSchema.index({ tenantId: 1, name: 1, section: 1 });
