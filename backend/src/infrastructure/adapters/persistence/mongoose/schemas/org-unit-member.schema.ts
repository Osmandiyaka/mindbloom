import { Schema, Types } from 'mongoose';

export const OrgUnitMemberSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        orgUnitId: { type: Types.ObjectId, ref: 'OrgUnit', index: true, required: true },
        userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
        roleInUnit: { type: String, trim: true },
        inherited: { type: Boolean, default: false },
        createdBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true }
);

OrgUnitMemberSchema.index({ tenantId: 1, orgUnitId: 1, userId: 1 }, { unique: true });
OrgUnitMemberSchema.index({ tenantId: 1, userId: 1 });
