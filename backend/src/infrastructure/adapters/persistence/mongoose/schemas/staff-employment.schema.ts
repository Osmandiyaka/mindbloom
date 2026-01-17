import { Schema, Types } from 'mongoose';

const EMPLOYMENT_STATUS = ['active', 'ended'] as const;

export const StaffEmploymentSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        schoolId: { type: Types.ObjectId, ref: 'School' },
        departmentOuId: { type: Types.ObjectId, ref: 'Department' },
        jobTitle: { type: String },
        employmentType: { type: String },
        contractType: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        status: { type: String, enum: EMPLOYMENT_STATUS, default: 'active' },
        workLocation: { type: String },
    },
    { timestamps: true, strict: true }
);

StaffEmploymentSchema.index({ tenantId: 1, staffMemberId: 1, startDate: -1 });
StaffEmploymentSchema.index({ tenantId: 1, schoolId: 1 });
