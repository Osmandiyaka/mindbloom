import { Schema, Types } from 'mongoose';

export const SchoolSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true },
        type: { type: String, default: 'mixed' },
        status: { type: String, default: 'pending_setup' },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            postalCode: { type: String },
            country: { type: String },
        },
        contact: {
            email: { type: String },
            phone: { type: String },
            website: { type: String },
        },
        domain: { type: String },
        settings: {
            gradingSystem: { type: String },
            termsConfig: { type: Schema.Types.Mixed },
            attendanceRules: { type: Schema.Types.Mixed },
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

SchoolSchema.index({ tenantId: 1, status: 1 });
SchoolSchema.index({ tenantId: 1, code: 1 }, { unique: true });
