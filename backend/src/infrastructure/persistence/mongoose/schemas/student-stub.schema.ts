import { Schema } from 'mongoose';

export const StudentStubSchema = new Schema(
    {
        fullName: { type: String, required: true },
        grade: { type: String, required: true },
        email: String,
    },
    { timestamps: true }
);
