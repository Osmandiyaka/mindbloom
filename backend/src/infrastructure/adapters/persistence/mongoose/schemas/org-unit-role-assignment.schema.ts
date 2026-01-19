import { Schema, Types } from 'mongoose';

export const OrgUnitRoleAssignmentSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', index: true, required: true },
        orgUnitId: { type: Types.ObjectId, ref: 'OrgUnit', index: true, required: true },
        roleId: { type: Types.ObjectId, ref: 'Role', index: true, required: true },
        scope: {
            type: String,
            enum: ['appliesToUnitOnly', 'inheritsDown'],
            default: 'inheritsDown',
        },
        createdBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true }
);

OrgUnitRoleAssignmentSchema.index({ tenantId: 1, orgUnitId: 1, roleId: 1 }, { unique: true });
