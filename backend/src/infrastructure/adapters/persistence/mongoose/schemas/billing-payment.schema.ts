import { Document, Schema } from 'mongoose';

export interface BillingPaymentDocument extends Document<string> {
    _id: string;
    tenantId: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    externalId: string;
    externalType?: string;
    invoiceId?: string | null;
    metadata?: Record<string, any>;
    failureCode?: string | null;
    failureMessage?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export const BillingPaymentSchema = new Schema<BillingPaymentDocument>(
    {
        _id: { type: String },
        tenantId: { type: String, required: true, index: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        gateway: { type: String, required: true },
        status: { type: String, required: true, enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED'] },
        externalId: { type: String, required: true },
        externalType: { type: String },
        invoiceId: { type: String, index: true, default: null },
        metadata: { type: Schema.Types.Mixed, default: {} },
        failureCode: { type: String, default: null },
        failureMessage: { type: String, default: null },
    },
    { timestamps: true },
);

BillingPaymentSchema.index({ gateway: 1, externalId: 1 }, { unique: true });
BillingPaymentSchema.index({ tenantId: 1, createdAt: -1 });
