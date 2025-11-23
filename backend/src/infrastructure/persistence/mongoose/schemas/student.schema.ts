import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'students', timestamps: true })
export class StudentDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    phone?: string;

    @Prop()
    dob?: Date;

    @Prop({ type: Types.ObjectId, ref: 'ClassDocument' })
    classId?: Types.ObjectId;

    @Prop()
    rollNo?: string;

    @Prop({ default: 'Active' })
    status: string;

    createdAt: Date;
    updatedAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(StudentDocument);

// Add compound indexes for tenant-based queries
StudentSchema.index({ tenantId: 1, email: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, status: 1 });
