import { Schema } from 'mongoose';

export const RoleSchema = new Schema(
    {
        tenantId: {
            type: String,
            required: function () { return !this.isGlobal; },
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        isSystemRole: {
            type: Boolean,
            default: false,
        },
        isGlobal: {
            type: Boolean,
            default: false,
        },
        permissions: [
            {
                resource: { type: String, required: true },
                actions: [{ type: String, required: true }],
                scope: { type: String, required: true },
                conditions: { type: Schema.Types.Mixed },
            },
        ],
        parentRoleId: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
        collection: 'roles',
    },
);

// Compound index for tenant isolation and unique role names per tenant (allows null for global)
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Unique constraint for global role names (tenantId null)
RoleSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isGlobal: true } });

// Index for finding system roles
RoleSchema.index({ tenantId: 1, isSystemRole: 1 });
RoleSchema.index({ isGlobal: 1 });

export interface RoleDocument {
    _id: string;
    tenantId: string | null;
    name: string;
    description: string;
    isSystemRole: boolean;
    isGlobal: boolean;
    permissions: Array<{
        resource: string;
        actions: string[];
        scope: string;
        conditions?: Record<string, any>;
    }>;
    parentRoleId?: string;
    createdAt: Date;
    updatedAt: Date;
}
