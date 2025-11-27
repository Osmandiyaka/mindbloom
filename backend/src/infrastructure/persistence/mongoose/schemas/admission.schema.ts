import { Schema } from 'mongoose';

export const AdmissionSchema = new Schema(
    {
        tenantId: { type: String, index: true },
        applicantName: { type: String, required: true },
        gradeApplying: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            enum: ['review', 'rejected', 'enrolled'],
            default: 'review',
        },
        statusHistory: [{
            from: String,
            to: String,
            changedBy: String,
            changedAt: Date,
            note: String,
        }],
        notes: { type: String },
        documents: [{ name: String, type: String, url: String }],
        statusUpdatedAt: { type: Date },
    },
    { timestamps: true }
);
