import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'invitations', timestamps: true })
export class InvitationDocument extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    email: string;

    @Prop({ type: [String], default: [] })
    roles: string[];

    @Prop({ required: true, enum: ['pending', 'accepted', 'expired', 'revoked', 'sent'], default: 'pending' })
    status: string;

    @Prop({ required: true })
    token: string;

    @Prop({ required: true })
    expiresAt: Date;

    @Prop({ required: true })
    createdBy: string;

    @Prop()
    sentAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(InvitationDocument);
InvitationSchema.index({ tenantId: 1, email: 1 });
InvitationSchema.index({ token: 1 });
