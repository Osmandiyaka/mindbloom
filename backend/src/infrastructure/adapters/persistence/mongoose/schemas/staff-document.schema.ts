import { Schema, Types } from 'mongoose';

const DOCUMENT_STATUS = ['uploaded', 'verified', 'rejected'] as const;

export const StaffDocumentSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        documentTypeId: { type: Types.ObjectId, ref: 'StaffDocumentType', required: true },
        file: {
            storageKey: { type: String },
            fileName: { type: String },
            mimeType: { type: String },
            sizeBytes: { type: Number },
        },
        status: { type: String, enum: DOCUMENT_STATUS, default: 'uploaded' },
        uploadedBy: { type: Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date },
        verifiedBy: { type: Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },
    },
    { timestamps: true, strict: true }
);

StaffDocumentSchema.index({ tenantId: 1, staffMemberId: 1 });
StaffDocumentSchema.index({ tenantId: 1, documentTypeId: 1 });
