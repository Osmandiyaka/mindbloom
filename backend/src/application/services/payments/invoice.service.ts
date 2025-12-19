import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BillingInvoice, InvoiceLine, InvoiceStatus } from '../../../domain/billing/entities/invoice.entity';
import { BillingInvoiceRepository, BILLING_INVOICE_REPOSITORY } from '../../../domain/ports/out/billing-invoice-repository.port';
import { PaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/ports/out/payment-repository.port';

export interface CreateInvoiceDraftInput {
    tenantId: string;
    editionId?: string | null;
    periodStart: Date;
    periodEnd: Date;
    currency: string;
    lines: InvoiceLine[];
    taxAmount?: number;
    discountAmount?: number;
}

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(
        @Inject(BILLING_INVOICE_REPOSITORY) private readonly invoices: BillingInvoiceRepository,
        @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    ) { }

    async createInvoiceDraft(input: CreateInvoiceDraftInput): Promise<BillingInvoice> {
        const existing = await this.invoices.findByPeriod(input.tenantId, input.editionId ?? null, input.periodStart, input.periodEnd);
        if (existing) {
            throw new Error('Invoice for this period already exists');
        }

        const subtotal = this.computeSubtotal(input.lines);
        const taxAmount = input.taxAmount ?? 0;
        const discountAmount = input.discountAmount ?? 0;
        const total = Math.max(subtotal + taxAmount - discountAmount, 0);

        const now = new Date();
        const invoice = new BillingInvoice({
            id: randomUUID(),
            tenantId: input.tenantId,
            editionId: input.editionId ?? null,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            currency: input.currency,
            subtotalAmount: subtotal,
            taxAmount,
            discountAmount,
            totalAmount: total,
            status: 'DRAFT',
            invoiceNumber: this.generateInvoiceNumber(input.tenantId),
            lines: input.lines,
            createdAt: now,
            updatedAt: now,
        });

        const created = await this.invoices.create(invoice);
        this.emitAudit('InvoiceCreated', input.tenantId, { invoiceId: created.id, invoiceNumber: created.invoiceNumber, totalAmount: created.totalAmount });
        return created;
    }

    async issueInvoice(invoiceId: string, tenantId: string): Promise<BillingInvoice> {
        const invoice = await this.requireInvoice(invoiceId, tenantId);
        if (invoice.status !== 'DRAFT') throw new Error('Only draft invoices can be issued');
        invoice.markIssued(new Date());
        const updated = await this.invoices.update(invoice);
        this.emitAudit('InvoiceIssued', tenantId, { invoiceId: updated.id, invoiceNumber: updated.invoiceNumber });
        return updated;
    }

    async markInvoicePaid(invoiceId: string, paymentId: string | null, tenantId: string): Promise<BillingInvoice> {
        const invoice = await this.requireInvoice(invoiceId, tenantId);
        if (invoice.status !== 'ISSUED' && invoice.status !== 'OVERDUE') {
            throw new Error('Invoice must be issued or overdue to mark as paid');
        }
        invoice.markPaid(new Date());
        const updated = await this.invoices.update(invoice);

        if (paymentId) {
            const payment = await this.payments.findById(paymentId, tenantId);
            if (!payment) throw new Error('Payment not found');
            if (payment.tenantId !== tenantId) throw new Error('Tenant mismatch between payment and invoice');
            if (!payment.invoiceId) {
                payment.linkInvoice(invoiceId);
                await this.payments.update(payment);
            }
        }

        this.emitAudit('InvoicePaid', tenantId, { invoiceId: updated.id, invoiceNumber: updated.invoiceNumber, paymentId });
        return updated;
    }

    async markInvoiceOverdue(invoiceId: string, tenantId: string): Promise<BillingInvoice> {
        const invoice = await this.requireInvoice(invoiceId, tenantId);
        if (invoice.status !== 'ISSUED') {
            throw new Error('Only issued invoices can be marked overdue');
        }
        invoice.markOverdue();
        const updated = await this.invoices.update(invoice);
        this.emitAudit('InvoiceOverdue', tenantId, { invoiceId: updated.id, invoiceNumber: updated.invoiceNumber });
        return updated;
    }

    async voidInvoice(invoiceId: string, tenantId: string, reason?: string): Promise<BillingInvoice> {
        const invoice = await this.requireInvoice(invoiceId, tenantId);
        if (!['DRAFT', 'ISSUED', 'OVERDUE'].includes(invoice.status)) {
            throw new Error('Only draft, issued, or overdue invoices can be voided');
        }
        invoice.void(reason);
        const updated = await this.invoices.update(invoice);
        this.emitAudit('InvoiceVoided', tenantId, { invoiceId: updated.id, invoiceNumber: updated.invoiceNumber, reason });
        return updated;
    }

    private async requireInvoice(invoiceId: string, tenantId: string): Promise<BillingInvoice> {
        const invoice = await this.invoices.findById(invoiceId, tenantId);
        if (!invoice) throw new Error('Invoice not found');
        return invoice;
    }

    private computeSubtotal(lines: InvoiceLine[]): number {
        return (lines || []).reduce((sum, line) => sum + (line.totalAmount ?? (line.quantity * line.unitAmount)), 0);
    }

    private generateInvoiceNumber(tenantId: string): string {
        const year = new Date().getFullYear();
        const tenantCode = tenantId.slice(0, 6).toUpperCase();
        const sequence = Date.now().toString().slice(-6);
        return `${tenantCode}-INV-${year}-${sequence}`;
    }

    private emitAudit(action: string, tenantId: string, payload: Record<string, any>): void {
        const audit = {
            action,
            tenantId,
            actor: 'system',
            timestamp: new Date().toISOString(),
            ...payload,
        };
        this.logger.log(JSON.stringify(audit));
    }
}
