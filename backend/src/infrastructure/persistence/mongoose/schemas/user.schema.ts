import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    name: string;

    @Prop({ default: 'user' })
    role: string;

    @Prop({ type: [String], default: [] })
    permissions: string[];

    createdAt: Date;
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Add compound index for tenant-based queries
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
