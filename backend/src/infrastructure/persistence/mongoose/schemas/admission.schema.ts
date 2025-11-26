import { Schema } from 'mongoose';

export const AdmissionSchema = new Schema(
    {
        applicantName: { type: String, required: true },
        gradeApplying: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            enum: ['review', 'rejected', 'enrolled'],
            default: 'review',
        },
        notes: { type: String },
        documents: [{ name: String, type: String, url: String }],
    },
    { timestamps: true }
);
