import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Payment, PaymentStatus } from '../../../domain/billing/entities/payment.entity';
import { PaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/ports/out/payment-repository.port';
import { BillingInvoiceRepository, BILLING_INVOICE_REPOSITORY } from '../../../domain/ports/out/billing-invoice-repository.port';

export interface PaymentInitiatedInput {
    tenantId: string;
    amount: number;
    currency: string;
    gateway: string;
    externalId: string;
    externalType?: string;
    metadata?: Record<string, any>;
    invoiceId?: string | null;
}

export interface GatewayPaymentEvent {
    gateway: string;
    eventId?: string;
    eventType?: string;
    externalId: string;
    externalType?: string;
    amount?: number;
    currency?: string;
    statusHint?: string;
    invoiceId?: string | null;
    tenantId?: string | null;
    metadata?: Record<string, any>;
    failureCode?: string | null;
    failureMessage?: string | null;
}

@Injectable()
export class PaymentHistoryService {
    private readonly logger = new Logger(PaymentHistoryService.name);

    constructor(
        @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
        @Inject(BILLING_INVOICE_REPOSITORY) private readonly invoices: BillingInvoiceRepository,
    ) { }

    async recordPaymentInitiated(input: PaymentInitiatedInput): Promise<Payment> {
        const now = new Date();
        const payment = new Payment({
            id: input.externalId || randomUUID(),
            tenantId: input.tenantId,
            amount: input.amount,
            currency: input.currency,
            gateway: input.gateway,
            status: 'PENDING',
            externalId: input.externalId,
            externalType: input.externalType,
            invoiceId: input.invoiceId || null,
            metadata: input.metadata || {},
            createdAt: now,
            updatedAt: now,
        });

        const created = await this.payments.create(payment);
        this.emitAudit('PaymentCreated', input.tenantId, { paymentId: created.id, gateway: created.gateway, status: created.status, amount: created.amount, currency: created.currency, invoiceId: created.invoiceId });
        return created;
    }

    async upsertFromGatewayEvent(event: GatewayPaymentEvent): Promise<Payment> {
        const existing = await this.payments.findByGatewayReference(event.gateway, event.externalId);
        const tenantId = event.tenantId || existing?.tenantId;
        if (!tenantId) {
            throw new Error('tenantId is required to reconcile payment event');
        }

        const status = this.mapStatus(event);
        const now = new Date();

        if (existing) {
            existing.mergeMetadata(event.metadata);
            existing.updateStatus(status, event.failureCode, event.failureMessage);
            if (event.invoiceId) {
                existing.linkInvoice(event.invoiceId);
            }
            const updated = await this.payments.update(existing);
            this.emitAudit('PaymentStatusUpdated', tenantId, {
                paymentId: updated.id,
                gateway: updated.gateway,
                externalId: updated.externalId,
                status,
                eventId: event.eventId,
                eventType: event.eventType,
            });
            if (status === 'SUCCEEDED' && updated.invoiceId) {
                await this.markInvoicePaidIfApplicable(updated.invoiceId, tenantId, event);
            }
            return updated;
        }

        const payment = new Payment({
            id: event.externalId || randomUUID(),
            tenantId,
            amount: event.amount ?? 0,
            currency: event.currency || 'usd',
            gateway: event.gateway,
            status,
            externalId: event.externalId,
            externalType: event.externalType,
            invoiceId: event.invoiceId || null,
            metadata: event.metadata || {},
            failureCode: event.failureCode,
            failureMessage: event.failureMessage,
            createdAt: now,
            updatedAt: now,
        });

        const created = await this.payments.create(payment);
        this.emitAudit('PaymentCreated', tenantId, {
            paymentId: created.id,
            gateway: created.gateway,
            externalId: created.externalId,
            status,
            eventId: event.eventId,
            eventType: event.eventType,
        });

        if (status === 'SUCCEEDED' && created.invoiceId) {
            await this.markInvoicePaidIfApplicable(created.invoiceId, tenantId, event);
        }

        return created;
    }

    async linkPaymentToInvoice(paymentId: string, invoiceId: string, tenantId: string): Promise<void> {
        const payment = await this.payments.findById(paymentId, tenantId);
        if (!payment) throw new Error('Payment not found');
        const invoice = await this.invoices.findById(invoiceId, tenantId);
        if (!invoice) throw new Error('Invoice not found');
        if (payment.tenantId !== invoice.tenantId) {
            throw new Error('Tenant mismatch between payment and invoice');
        }
        payment.linkInvoice(invoiceId);
        await this.payments.update(payment);
    }

    async markInvoicePaidIfApplicable(invoiceId: string, tenantId: string, context?: { amount?: number; eventType?: string; eventId?: string }): Promise<void> {
        const invoice = await this.invoices.findById(invoiceId, tenantId);
        if (!invoice) return;
        const payments = await this.payments.findByInvoiceId(invoiceId, tenantId);
        const succeeded = payments.filter(p => p.status === 'SUCCEEDED');
        const totalPaid = succeeded.reduce((sum, p) => sum + (p.amount || 0), 0);

        if (totalPaid >= invoice.totalAmount) {
            invoice.markPaid(new Date());
            await this.invoices.update(invoice);
            this.emitAudit('InvoicePaid', tenantId, {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount,
                totalPaid,
                eventType: context?.eventType,
                eventId: context?.eventId,
            });
        } else if (succeeded.length > 0 && totalPaid < invoice.totalAmount) {
            this.emitAudit('PaymentInvoiceMismatch', tenantId, {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount,
                totalPaid,
                eventType: context?.eventType,
                eventId: context?.eventId,
            });
        }
    }

    private mapStatus(event: GatewayPaymentEvent): PaymentStatus {
        const hint = (event.statusHint || event.eventType || '').toLowerCase();
        if (hint.includes('fail')) return 'FAILED';
        if (hint.includes('cancel')) return 'CANCELED';
        if (hint.includes('refund')) return 'REFUNDED';
        if (hint.includes('succeed') || hint.includes('complete')) return 'SUCCEEDED';
        return 'PENDING';
    }

    private emitAudit(action: string, tenantId: string, payload: Record<string, any>): void {
        const audit = {
            action,
            tenantId,
            actor: 'gateway-webhook',
            timestamp: new Date().toISOString(),
            ...payload,
        };
        this.logger.log(JSON.stringify(audit));
    }
}
