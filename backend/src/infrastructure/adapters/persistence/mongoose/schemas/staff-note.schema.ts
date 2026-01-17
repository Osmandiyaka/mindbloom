import { Schema, Types } from 'mongoose';

const NOTE_VISIBILITY = ['internal', 'hr', 'admin'] as const;

export const StaffNoteSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        visibility: { type: String, enum: NOTE_VISIBILITY, default: 'internal' },
        title: { type: String },
        body: { type: String },
        createdBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true }
);

StaffNoteSchema.index({ tenantId: 1, staffMemberId: 1, createdAt: -1 });
