import { Schema } from 'mongoose';

export const PurchaseRequestSchema = new Schema(
    {
        tenantId: { type: String, index: true },
        budgetId: { type: Schema.Types.ObjectId, ref: 'Budget', index: true },
        budgetCode: { type: String },
        budgetName: { type: String },
        requesterId: { type: String },
        requesterName: { type: String },
        description: { type: String, required: true },
        vendor: { type: String },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        approvals: [{ approverId: String, approverName: String, approvedAt: Date, note: String }],
        approvedAt: { type: Date },
        journalId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    },
    { timestamps: true }
);

PurchaseRequestSchema.index({ tenantId: 1, status: 1 });
