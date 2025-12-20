import { Document, Schema } from 'mongoose';

export interface BillingInvoiceDocument extends Document<string> {
    _id: string;
    tenantId: string;
    editionId?: string | null;
    periodStart: Date;
    periodEnd: Date;
    currency: string;
    subtotalAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    status: string;
    invoiceNumber: string;
    lines: Array<{
        description: string;
        quantity: number;
        unitAmount: number;
        totalAmount: number;
        featureSnapshot?: Record<string, any>;
        metadata?: Record<string, any>;
    }>;
    issuedAt?: Date | null;
    paidAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceLineSchema = new Schema(
    {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitAmount: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        featureSnapshot: { type: Schema.Types.Mixed },
        metadata: { type: Schema.Types.Mixed },
    },
    { _id: false },
);

export const BillingInvoiceSchema = new Schema<BillingInvoiceDocument>(
    {
        _id: { type: String },
        tenantId: { type: String, required: true, index: true },
        editionId: { type: String, index: true, default: null },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        currency: { type: String, required: true },
        subtotalAmount: { type: Number, required: true },
        taxAmount: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, required: true, default: 0 },
        totalAmount: { type: Number, required: true },
        status: { type: String, enum: ['DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE'], required: true },
        invoiceNumber: { type: String, required: true, unique: true },
        lines: { type: [InvoiceLineSchema], default: [] },
        issuedAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true },
);

BillingInvoiceSchema.index({ tenantId: 1, periodStart: 1, periodEnd: 1, editionId: 1 }, { unique: true });
