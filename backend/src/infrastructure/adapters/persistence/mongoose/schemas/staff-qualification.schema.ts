import { Schema, Types } from 'mongoose';

export const StaffQualificationSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        institution: { type: String },
        qualificationType: { type: String },
        fieldOfStudy: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        verifiedAt: { type: Date },
    },
    { timestamps: true, strict: true }
);

StaffQualificationSchema.index({ tenantId: 1, staffMemberId: 1 });
