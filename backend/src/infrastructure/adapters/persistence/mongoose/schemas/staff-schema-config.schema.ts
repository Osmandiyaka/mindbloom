import { Schema, Types } from 'mongoose';

export const StaffSchemaConfigSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        requiredFields: { type: [String], default: [] },
        enabledFields: { type: [String], default: [] },
        relationshipOptions: {
            guardianRelationships: { type: [String], default: [] },
            emergencyRelationships: { type: [String], default: [] },
        },
        noteVisibilityOptions: { type: [String], default: [] },
        employmentTypes: { type: [String], default: [] },
        roleInAssignmentOptions: { type: [String], default: [] },
        updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, strict: true }
);

StaffSchemaConfigSchema.index({ tenantId: 1 }, { unique: true });
