import { Schema } from 'mongoose';

export const BudgetSchema = new Schema(
    {
        tenantId: { type: String, index: true },
        name: { type: String, required: true },
        code: { type: String, required: true },
        ownerId: { type: String },
        ownerName: { type: String },
        approvers: [{ type: String }],
        limit: { type: Number, required: true },
        spent: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'closed'], default: 'active' },
        notes: String,
    },
    { timestamps: true }
);

BudgetSchema.virtual('available').get(function () {
    return Math.max((this.limit || 0) - (this.spent || 0), 0);
});

BudgetSchema.index({ tenantId: 1, status: 1 });
BudgetSchema.index({ code: 1, tenantId: 1 }, { unique: true });
