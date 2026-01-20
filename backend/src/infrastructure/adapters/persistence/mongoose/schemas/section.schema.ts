import { Schema, Types } from 'mongoose';

export const SectionSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        classId: { type: Types.ObjectId, ref: 'Class', index: true, required: true },
        academicYearId: { type: Types.ObjectId, ref: 'AcademicYear' },
        name: { type: String, required: true, trim: true },
        normalizedName: { type: String, required: true, trim: true },
        code: { type: String, trim: true },
        capacity: { type: Number },
        status: { type: String, enum: ['active', 'archived'], default: 'active' },
        sortOrder: { type: Number, default: 0 },
        archivedAt: { type: Date, default: null },
        createdBy: { type: Types.ObjectId, ref: 'User' },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true, collection: 'sections' }
);

SectionSchema.index({ tenantId: 1, classId: 1, status: 1 });
SectionSchema.index(
    { tenantId: 1, classId: 1, normalizedName: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } },
);
