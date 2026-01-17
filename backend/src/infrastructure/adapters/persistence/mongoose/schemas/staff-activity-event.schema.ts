import { Schema, Types } from 'mongoose';

const ACTIVITY_CATEGORY = ['profile', 'employment', 'assignment', 'documents', 'access', 'notes'] as const;

export const StaffActivityEventSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        eventType: { type: String, required: true },
        title: { type: String },
        category: { type: String, enum: ACTIVITY_CATEGORY },
        actorUserId: { type: Types.ObjectId, ref: 'User' },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true, strict: true }
);

StaffActivityEventSchema.index({ tenantId: 1, staffMemberId: 1, createdAt: -1 });
