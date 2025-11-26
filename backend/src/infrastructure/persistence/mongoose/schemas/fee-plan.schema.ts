import { Schema } from 'mongoose';

export const FeePlanSchema = new Schema(
    {
        name: { type: String, required: true },
        description: String,
        amount: { type: Number, required: true },
        frequency: { type: String, enum: ['one-time', 'monthly', 'term'], default: 'monthly' },
        currency: { type: String, default: 'USD' },
    },
    { timestamps: true }
);
