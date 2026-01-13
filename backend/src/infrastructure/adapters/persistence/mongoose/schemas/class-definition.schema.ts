import { Schema } from 'mongoose';

export const ClassDefinitionSchema = new Schema(
    {
        tenantId: { type: String, index: true, required: true },
        name: { type: String, required: true },
        code: { type: String },
        levelType: { type: String },
        sortOrder: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        schoolIds: { type: [String], default: null },
        notes: { type: String },
    },
    { timestamps: true }
);

ClassDefinitionSchema.index({ tenantId: 1, name: 1 });
