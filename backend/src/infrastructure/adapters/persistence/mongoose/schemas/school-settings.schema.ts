import { Schema, Types } from 'mongoose';

export const SchoolSettingsSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true },
        schoolName: { type: String, required: true },
        domain: { type: String },
        addressLine1: { type: String },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
        timezone: { type: String, default: 'UTC' },
        locale: { type: String, default: 'en-US' },
        academicYear: {
            start: { type: Date },
            end: { type: Date },
        },
        contactEmail: { type: String },
        contactPhone: { type: String },
        website: { type: String },
        logoUrl: { type: String },
        faviconUrl: { type: String },
        gradingScheme: {
            type: { type: String, default: 'Percentage' },
            passThreshold: { type: Number, default: 40 },
        },
        departments: [{ name: String, code: String }],
        grades: [{ name: String, code: String, level: String }],
        subjects: [{ name: String, code: String }],
    },
    { timestamps: true },
);

SchoolSettingsSchema.index({ tenantId: 1 }, { unique: true, sparse: true });
