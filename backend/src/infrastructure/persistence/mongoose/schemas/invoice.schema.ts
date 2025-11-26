import { Schema } from 'mongoose';

export const InvoiceSchema = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
        studentName: { type: String, required: true },
        planId: { type: Schema.Types.ObjectId, ref: 'FeePlan', required: true },
        planName: { type: String },
        dueDate: { type: Date, required: true },
        issuedDate: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        status: { type: String, enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'], default: 'issued' },
        reference: String,
        notes: String,
        lastPaymentAt: { type: Date },
    },
    { timestamps: true }
);

InvoiceSchema.virtual('balance').get(function () {
    return Math.max((this.amount || 0) - (this.paidAmount || 0), 0);
});

InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ planId: 1 });
