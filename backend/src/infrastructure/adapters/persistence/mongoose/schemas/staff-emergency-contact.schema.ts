import { Schema, Types } from 'mongoose';

export const StaffEmergencyContactSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        name: { type: String, required: true },
        relationship: { type: String },
        phone: { type: String },
        email: { type: String },
        isPrimary: { type: Boolean, default: false },
    },
    { timestamps: true, strict: true }
);

StaffEmergencyContactSchema.index({ tenantId: 1, staffMemberId: 1 });
