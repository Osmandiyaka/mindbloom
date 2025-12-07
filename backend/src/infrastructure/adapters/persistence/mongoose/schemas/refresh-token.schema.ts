import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'refresh_tokens', timestamps: true })
export class RefreshTokenDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, unique: true })
    tokenHash: string;

    @Prop({ type: Date, required: true, index: true })
    expiresAt: Date;

    @Prop({ type: Date, default: null })
    revokedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenDocument);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
