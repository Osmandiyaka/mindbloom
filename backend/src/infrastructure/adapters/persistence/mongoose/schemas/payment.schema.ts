import { Schema, Types } from 'mongoose';

export const PaymentSchema = new Schema(
    {
        invoiceId: { type: Types.ObjectId, ref: 'Invoice', required: true, index: true },
        studentId: { type: Types.ObjectId, ref: 'Student' },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        method: { type: String, enum: ['cash', 'card', 'transfer', 'online', 'other'], default: 'cash' },
        reference: { type: String },
        notes: { type: String },
        status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
        paidAt: { type: Date, default: Date.now },
        recordedBy: { type: Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
);

PaymentSchema.index({ invoiceId: 1, status: 1 });
