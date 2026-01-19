import { Schema, Types } from 'mongoose';

export const GradeSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        schoolIds: { type: [Types.ObjectId], ref: 'School', required: true },
        name: { type: String, required: true, trim: true },
        normalizedName: { type: String, required: true, trim: true },
        code: { type: String, trim: true },
        sortOrder: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'archived'], default: 'active' },
        scopeKey: { type: String, required: true },
        archivedAt: { type: Date, default: null },
        createdBy: { type: Types.ObjectId, ref: 'User' },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true, collection: 'grades' }
);

GradeSchema.index({ tenantId: 1, status: 1 });
GradeSchema.index({ tenantId: 1, schoolIds: 1 });
GradeSchema.index(
    { tenantId: 1, scopeKey: 1, normalizedName: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } },
);
