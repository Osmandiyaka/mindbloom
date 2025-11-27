import { Schema } from 'mongoose';

export const ExpenseClaimSchema = new Schema(
    {
        tenantId: { type: String, index: true },
        budgetId: { type: Schema.Types.ObjectId, ref: 'Budget', index: true },
        budgetCode: { type: String },
        budgetName: { type: String },
        claimantId: { type: String },
        claimantName: { type: String },
        purpose: { type: String, required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['draft', 'submitted', 'approved', 'reimbursed'], default: 'draft' },
        submittedAt: { type: Date },
        approvedAt: { type: Date },
        reimbursedAt: { type: Date },
        attachments: [{ name: String, url: String }],
        journalId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    },
    { timestamps: true }
);

ExpenseClaimSchema.index({ tenantId: 1, status: 1 });
