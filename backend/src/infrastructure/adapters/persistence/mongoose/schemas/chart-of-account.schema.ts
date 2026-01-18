import { Schema } from 'mongoose';

export const ChartOfAccountSchema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['asset', 'liability', 'equity', 'income', 'expense'], required: true },
        parentCode: { type: String },
        isLeaf: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
        tags: [{ type: String }],
    },
    { timestamps: true },
);
