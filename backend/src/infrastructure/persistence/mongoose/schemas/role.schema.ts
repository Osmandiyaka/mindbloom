import { Schema } from 'mongoose';

export const RoleSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
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

// Compound index for tenant isolation and unique role names per tenant
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Index for finding system roles
RoleSchema.index({ tenantId: 1, isSystemRole: 1 });

export interface RoleDocument {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
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
