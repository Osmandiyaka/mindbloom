import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: false, default: null, index: true })
    tenantId: Types.ObjectId | null;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Role', default: null })
    roleId: Types.ObjectId | null;

    @Prop({ type: [String], default: [] })
    permissions: string[];

    @Prop({ type: String, default: null })
    profilePicture: string | null;

    @Prop({ type: Boolean, default: false })
    forcePasswordReset: boolean;

    @Prop({ type: Boolean, default: false })
    mfaEnabled: boolean;

    @Prop({ type: String, default: null })
    resetToken?: string | null;

    @Prop({ type: Date, default: null })
    resetTokenExpires?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Add compound index for tenant-based queries
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ resetToken: 1, resetTokenExpires: 1 });
