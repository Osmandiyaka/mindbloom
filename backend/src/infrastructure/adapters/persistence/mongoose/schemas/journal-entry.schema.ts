import { Schema } from 'mongoose';

export const JournalEntrySchema = new Schema(
    {
        refNo: { type: String },
        date: { type: Date, required: true },
        memo: { type: String },
        status: { type: String, enum: ['draft', 'posted'], default: 'draft' },
        postedAt: { type: Date },
        postedBy: { type: String },
        lines: [
            {
                accountCode: { type: String, required: true },
                debit: { type: Number, default: 0 },
                credit: { type: Number, default: 0 },
                entityType: { type: String },
                entityId: { type: String },
                costCenter: { type: String },
                notes: { type: String },
            },
        ],
        source: { type: String }, // e.g., 'fees.invoice', 'fees.payment', 'manual'
        sourceId: { type: String },
    },
    { timestamps: true },
);

JournalEntrySchema.index({ date: 1 });
JournalEntrySchema.index({ status: 1, date: 1 });
JournalEntrySchema.index({ source: 1, sourceId: 1 }, { unique: false, sparse: true });
