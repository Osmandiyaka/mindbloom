import { Schema, Types } from 'mongoose';

export const StaffContactSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        email: { type: String },
        phone: { type: String },
        address: {
            line1: { type: String },
            line2: { type: String },
            city: { type: String },
            region: { type: String },
            country: { type: String },
            postalCode: { type: String },
        },
        isPrimary: { type: Boolean, default: false },
    },
    { timestamps: true, strict: true }
);

StaffContactSchema.index({ tenantId: 1, staffMemberId: 1 });
