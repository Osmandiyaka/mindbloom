import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'tenants', timestamps: true })
export class TenantDocument extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    subdomain: string;

    @Prop({ required: true, enum: ['active', 'suspended', 'inactive'], default: 'active' })
    status: string;

    @Prop({ required: true, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' })
    plan: string;

    @Prop({ type: Object })
    settings?: {
        maxStudents?: number;
        maxTeachers?: number;
        maxClasses?: number;
        features?: string[];
        customization?: {
            logo?: string;
            primaryColor?: string;
            secondaryColor?: string;
        };
    };

    createdAt: Date;
    updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDocument);

// Add index for subdomain lookup
TenantSchema.index({ subdomain: 1 });
