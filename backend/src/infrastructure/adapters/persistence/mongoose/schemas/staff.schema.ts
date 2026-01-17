import { Schema, Types } from 'mongoose';

const STAFF_STATUS = ['draft', 'pending', 'active', 'onLeave', 'suspended', 'archived', 'terminated'] as const;

export const StaffSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffCode: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        preferredName: { type: String },
        dob: { type: Date },
        gender: { type: String },
        nationality: { type: String },
        photoUrl: { type: String },
        status: { type: String, enum: STAFF_STATUS, default: 'active' },
        archivedAt: { type: Date },
        createdBy: { type: Types.ObjectId, ref: 'User' },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
        primarySchoolId: { type: Types.ObjectId, ref: 'School' },
        primaryContactId: { type: Types.ObjectId, ref: 'StaffContact' },
        primaryEmergencyContactId: { type: Types.ObjectId, ref: 'StaffEmergencyContact' },
        userId: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true }
);

StaffSchema.index({ tenantId: 1, staffCode: 1 }, { unique: true });
StaffSchema.index({ tenantId: 1, status: 1 });
StaffSchema.index({ tenantId: 1, lastName: 1 });
StaffSchema.index({ tenantId: 1, primarySchoolId: 1 });

