import { Schema, Types, Document } from 'mongoose';

export interface PaymentDocument extends Document {
    tenantId: string;
    invoiceId: Types.ObjectId;
    studentId?: Types.ObjectId;
    amount: number;
    currency: string;
    method: string;
    reference?: string;
    notes?: string;
    status: string;
    paidAt: Date;
    recordedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const PaymentSchema = new Schema(
    {
        tenantId: { type: String, index: true, required: true },
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
