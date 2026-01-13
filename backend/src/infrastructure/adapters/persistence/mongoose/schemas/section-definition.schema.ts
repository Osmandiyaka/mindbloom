import { Schema } from 'mongoose';

export const SectionDefinitionSchema = new Schema(
    {
        tenantId: { type: String, index: true, required: true },
        classId: { type: String, index: true, required: true },
        name: { type: String, required: true },
        code: { type: String },
        capacity: { type: Number },
        homeroomTeacherId: { type: String },
        active: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

SectionDefinitionSchema.index({ tenantId: 1, classId: 1 });
