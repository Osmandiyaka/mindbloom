import { Schema } from 'mongoose';

export const DesignationSchema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        description: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

DesignationSchema.index({ code: 1 }, { unique: true });
