import { Schema } from 'mongoose';

export const FiscalPeriodSchema = new Schema(
    {
        name: { type: String, required: true },
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        status: { type: String, enum: ['open', 'closed', 'locked'], default: 'open' },
        lockedBy: { type: String },
        lockedAt: { type: Date },
    },
    { timestamps: true },
);

FiscalPeriodSchema.index({ start: 1, end: 1 });
