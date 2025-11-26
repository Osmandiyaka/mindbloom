import { Schema } from 'mongoose';

export const InvoiceSchema = new Schema(
    {
        studentName: { type: String, required: true },
        planId: { type: Schema.Types.ObjectId, ref: 'FeePlan', required: true },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['draft', 'issued', 'paid', 'overdue'], default: 'issued' },
        reference: String,
    },
    { timestamps: true }
);
