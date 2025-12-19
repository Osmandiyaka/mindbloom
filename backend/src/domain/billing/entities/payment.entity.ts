export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';

export interface PaymentProps {
    id: string;
    tenantId: string;
    amount: number;
    currency: string;
    gateway: string;
    status: PaymentStatus;
    externalId: string;
    externalType?: string | null;
    invoiceId?: string | null;
    metadata?: Record<string, any> | null;
    failureCode?: string | null;
    failureMessage?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class Payment {
    private props: PaymentProps;

    constructor(props: PaymentProps) {
        this.props = { ...props };
        this.validate();
    }

    private validate(): void {
        if (!this.props.id) throw new Error('Payment id is required');
        if (!this.props.tenantId) throw new Error('tenantId is required');
        if (this.props.amount == null || this.props.amount < 0) throw new Error('amount must be non-negative');
        if (!this.props.currency) throw new Error('currency is required');
        if (!this.props.gateway) throw new Error('gateway is required');
        if (!this.props.status) throw new Error('status is required');
        if (!this.props.externalId) throw new Error('externalId is required');
    }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get amount() { return this.props.amount; }
    get currency() { return this.props.currency; }
    get gateway() { return this.props.gateway; }
    get status() { return this.props.status; }
    get externalId() { return this.props.externalId; }
    get externalType() { return this.props.externalType || null; }
    get invoiceId() { return this.props.invoiceId || null; }
    get metadata() { return this.props.metadata || {}; }
    get failureCode() { return this.props.failureCode || null; }
    get failureMessage() { return this.props.failureMessage || null; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    linkInvoice(invoiceId: string): void {
        if (!invoiceId) throw new Error('invoiceId is required to link payment');
        this.props.invoiceId = invoiceId;
    }

    updateStatus(status: PaymentStatus, failureCode?: string | null, failureMessage?: string | null): void {
        this.props.status = status;
        if (failureCode) this.props.failureCode = failureCode;
        if (failureMessage) this.props.failureMessage = failureMessage;
        this.props.updatedAt = new Date();
    }

    mergeMetadata(metadata: Record<string, any> | null | undefined): void {
        if (!metadata) return;
        this.props.metadata = { ...(this.props.metadata || {}), ...metadata };
    }

    toJSON(): PaymentProps {
        return { ...this.props };
    }
}
