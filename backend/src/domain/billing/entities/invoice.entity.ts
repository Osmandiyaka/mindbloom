export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE';

export interface InvoiceLine {
    description: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    featureSnapshot?: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface InvoiceProps {
    id: string;
    tenantId: string;
    editionId?: string | null;
    periodStart: Date;
    periodEnd: Date;
    currency: string;
    subtotalAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    status: InvoiceStatus;
    invoiceNumber: string;
    lines: InvoiceLine[];
    issuedAt?: Date | null;
    paidAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class BillingInvoice {
    private props: InvoiceProps;

    constructor(props: InvoiceProps) {
        this.props = { ...props, lines: props.lines || [] };
        this.validate();
    }

    private validate(): void {
        if (!this.props.id) throw new Error('Invoice id is required');
        if (!this.props.tenantId) throw new Error('tenantId is required');
        if (!this.props.periodStart || !this.props.periodEnd) throw new Error('period is required');
        if (this.props.periodEnd < this.props.periodStart) throw new Error('periodEnd must be after periodStart');
        if (!this.props.currency) throw new Error('currency is required');
        if (this.props.totalAmount == null || this.props.totalAmount < 0) throw new Error('totalAmount must be non-negative');
        if (!this.props.invoiceNumber) throw new Error('invoiceNumber is required');
        if (!this.props.status) throw new Error('status is required');
    }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get editionId() { return this.props.editionId || null; }
    get periodStart() { return this.props.periodStart; }
    get periodEnd() { return this.props.periodEnd; }
    get currency() { return this.props.currency; }
    get subtotalAmount() { return this.props.subtotalAmount; }
    get taxAmount() { return this.props.taxAmount; }
    get discountAmount() { return this.props.discountAmount; }
    get totalAmount() { return this.props.totalAmount; }
    get status() { return this.props.status; }
    get invoiceNumber() { return this.props.invoiceNumber; }
    get lines() { return this.props.lines; }
    get issuedAt() { return this.props.issuedAt || null; }
    get paidAt() { return this.props.paidAt || null; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    markIssued(issuedAt: Date): void {
        this.props.status = 'ISSUED';
        this.props.issuedAt = issuedAt;
        this.props.updatedAt = new Date();
    }

    markPaid(paidAt: Date): void {
        this.props.status = 'PAID';
        this.props.paidAt = paidAt;
        this.props.updatedAt = new Date();
    }

    markOverdue(): void {
        this.props.status = 'OVERDUE';
        this.props.updatedAt = new Date();
    }

    void(reason?: string): void {
        this.props.status = 'VOID';
        this.props.updatedAt = new Date();
        if (reason) {
            const firstLine = this.props.lines?.[0];
            if (firstLine) {
                firstLine.metadata = { ...(firstLine.metadata || {}), voidReason: reason };
            }
        }
    }

    toJSON(): InvoiceProps {
        return { ...this.props, lines: [...(this.props.lines || [])] };
    }
}
