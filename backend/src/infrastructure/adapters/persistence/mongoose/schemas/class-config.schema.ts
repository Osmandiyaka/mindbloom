import { Schema, Types } from 'mongoose';

export const ClassConfigSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        classesScope: { type: String, enum: ['perAcademicYear', 'global'], default: 'global' },
        requireGradeLink: { type: Boolean, default: false },
        sectionUniquenessScope: { type: String, enum: ['perClass', 'perClassPerSchool'], default: 'perClassPerSchool' },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: { createdAt: false, updatedAt: true }, strict: true, collection: 'classConfigs' }
);

ClassConfigSchema.index({ tenantId: 1 }, { unique: true });
