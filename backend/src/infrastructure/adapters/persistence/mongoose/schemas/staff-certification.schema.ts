import { Schema, Types } from 'mongoose';

export const StaffCertificationSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        name: { type: String },
        issuer: { type: String },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        credentialId: { type: String },
        verifiedAt: { type: Date },
    },
    { timestamps: true, strict: true }
);

StaffCertificationSchema.index({ tenantId: 1, staffMemberId: 1 });
