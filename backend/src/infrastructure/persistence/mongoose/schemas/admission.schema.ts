import { Schema } from 'mongoose';

export const AdmissionSchema = new Schema(
    {
        applicantName: { type: String, required: true },
        gradeApplying: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            enum: ['inquiry', 'submitted', 'in_review', 'offer', 'waitlist', 'rejected', 'enrolled'],
            default: 'submitted',
        },
        notes: { type: String },
        documents: [{ name: String, type: String, url: String }],
    },
    { timestamps: true }
);
