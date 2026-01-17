import { Schema, Types } from 'mongoose';

export const StaffDocumentTypeSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true },
        category: { type: String },
        requiredForStaff: { type: Boolean, default: false },
        allowedMimeTypes: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, strict: true }
);

StaffDocumentTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });
