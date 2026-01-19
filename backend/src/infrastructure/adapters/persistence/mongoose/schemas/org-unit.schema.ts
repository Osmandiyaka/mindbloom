import { Schema, Types } from 'mongoose';

export const OrgUnitSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        name: { type: String, required: true, trim: true },
        code: { type: String, trim: true },
        type: {
            type: String,
            enum: ['organization', 'division', 'department', 'school', 'custom'],
            default: 'department',
        },
        status: { type: String, enum: ['active', 'archived'], default: 'active' },
        parentId: { type: Types.ObjectId, ref: 'OrgUnit', index: true, default: null },
        path: { type: [Types.ObjectId], default: [] },
        depth: { type: Number, default: 0 },
        sortOrder: { type: Number, default: 0 },
        createdBy: { type: Types.ObjectId, ref: 'User' },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
        archivedAt: { type: Date, default: null },
    },
    { timestamps: true, strict: true }
);

OrgUnitSchema.index({ tenantId: 1, parentId: 1, name: 1 });
OrgUnitSchema.index({ tenantId: 1, path: 1 });
OrgUnitSchema.index({ tenantId: 1, status: 1 });
