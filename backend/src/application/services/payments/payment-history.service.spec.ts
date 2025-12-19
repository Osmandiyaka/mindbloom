import { expect, jest } from '@jest/globals';
import { PaymentHistoryService, GatewayPaymentEvent } from './payment-history.service';
import { InvoiceService } from './invoice.service';
import { Payment, PaymentStatus } from '../../../domain/billing/entities/payment.entity';
import { BillingInvoice, InvoiceLine } from '../../../domain/billing/entities/invoice.entity';
import { PaymentRepository } from '../../../domain/ports/out/payment-repository.port';
import { BillingInvoiceRepository } from '../../../domain/ports/out/billing-invoice-repository.port';

class InMemoryPaymentRepository implements PaymentRepository {
    private store = new Map<string, Payment>();

    async create(payment: Payment): Promise<Payment> {
        this.store.set(payment.id, payment);
        return payment;
    }
    async update(payment: Payment): Promise<Payment> {
        this.store.set(payment.id, payment);
        return payment;
    }
    async findById(id: string, tenantId: string): Promise<Payment | null> {
        const payment = this.store.get(id) || null;
        if (payment && payment.tenantId !== tenantId) return null;
        return payment;
    }
    async findByGatewayReference(gateway: string, externalId: string): Promise<Payment | null> {
        return Array.from(this.store.values()).find(p => p.gateway === gateway && p.externalId === externalId) || null;
    }
    async findByInvoiceId(invoiceId: string, tenantId: string): Promise<Payment[]> {
        return Array.from(this.store.values()).filter(p => p.invoiceId === invoiceId && p.tenantId === tenantId);
    }
}

class InMemoryInvoiceRepository implements BillingInvoiceRepository {
    private store = new Map<string, BillingInvoice>();

    constructor(private readonly prefix: string = 'INV') { }

    async create(invoice: BillingInvoice): Promise<BillingInvoice> {
        this.store.set(invoice.id, invoice);
        return invoice;
    }
    async update(invoice: BillingInvoice): Promise<BillingInvoice> {
        this.store.set(invoice.id, invoice);
        return invoice;
    }
    async findById(id: string, tenantId: string): Promise<BillingInvoice | null> {
        const inv = this.store.get(id) || null;
        if (inv && inv.tenantId !== tenantId) return null;
        return inv;
    }
    async findByPeriod(tenantId: string, editionId: string | null, periodStart: Date, periodEnd: Date): Promise<BillingInvoice | null> {
        return Array.from(this.store.values()).find(inv => inv.tenantId === tenantId && inv.editionId === editionId && inv.periodStart.getTime() === periodStart.getTime() && inv.periodEnd.getTime() === periodEnd.getTime()) || null;
    }
    async findByInvoiceNumber(invoiceNumber: string, tenantId: string): Promise<BillingInvoice | null> {
        return Array.from(this.store.values()).find(inv => inv.invoiceNumber === invoiceNumber && inv.tenantId === tenantId) || null;
    }
}

function buildInvoice(tenantId: string, totalAmount: number): BillingInvoice {
    const now = new Date();
    return new BillingInvoice({
        id: `inv-${Math.random()}`,
        tenantId,
        editionId: 'ed-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        currency: 'usd',
        subtotalAmount: totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
        status: 'ISSUED',
        invoiceNumber: `TEST-${Date.now()}`,
        lines: [{ description: 'Plan', quantity: 1, unitAmount: totalAmount, totalAmount }],
        createdAt: now,
        updatedAt: now,
        issuedAt: now,
    });
}

describe('PaymentHistory + Invoice Services', () => {
    let paymentRepo: InMemoryPaymentRepository;
    let invoiceRepo: InMemoryInvoiceRepository;
    let paymentHistory: PaymentHistoryService;
    let invoiceService: InvoiceService;

    beforeEach(() => {
        paymentRepo = new InMemoryPaymentRepository();
        invoiceRepo = new InMemoryInvoiceRepository();
        paymentHistory = new PaymentHistoryService(paymentRepo, invoiceRepo);
        invoiceService = new InvoiceService(invoiceRepo, paymentRepo);
        (paymentHistory as any).logger = { log: jest.fn() };
        (invoiceService as any).logger = { log: jest.fn() };
    });

    it('upserts idempotently for the same gateway event', async () => {
        const event: GatewayPaymentEvent = {
            gateway: 'stripe',
            externalId: 'pi_123',
            tenantId: 't1',
            amount: 5000,
            currency: 'usd',
            statusHint: 'payment_intent.succeeded',
        };

        const first = await paymentHistory.upsertFromGatewayEvent(event);
        const second = await paymentHistory.upsertFromGatewayEvent(event);

        expect(first.id).toBe(second.id);
        const stored = await paymentRepo.findByGatewayReference('stripe', 'pi_123');
        expect(stored?.status).toBe('SUCCEEDED');
    });

    it('prevents duplicate invoice periods', async () => {
        const input = {
            tenantId: 't1',
            editionId: 'ed1',
            periodStart: new Date('2024-01-01'),
            periodEnd: new Date('2024-01-31'),
            currency: 'usd',
            lines: [{ description: 'Plan', quantity: 1, unitAmount: 1000, totalAmount: 1000 }] as InvoiceLine[],
        };

        await invoiceService.createInvoiceDraft(input);
        await expect(invoiceService.createInvoiceDraft(input)).rejects.toThrow('Invoice for this period already exists');
    });

    it('marks invoice paid when successful payment covers total', async () => {
        const invoice = buildInvoice('t1', 1200);
        await invoiceRepo.create(invoice);

        await paymentHistory.upsertFromGatewayEvent({
            gateway: 'stripe',
            externalId: 'pay_1',
            tenantId: 't1',
            amount: 1200,
            currency: 'usd',
            statusHint: 'succeeded',
            invoiceId: invoice.id,
        });

        await paymentHistory.markInvoicePaidIfApplicable(invoice.id, 't1');
        const updated = await invoiceRepo.findById(invoice.id, 't1');
        expect(updated?.status).toBe('PAID');
    });

    it('emits mismatch audit when payment total is less than invoice', async () => {
        const invoice = buildInvoice('t1', 1500);
        await invoiceRepo.create(invoice);

        await paymentHistory.upsertFromGatewayEvent({
            gateway: 'stripe',
            externalId: 'pay_2',
            tenantId: 't1',
            amount: 800,
            currency: 'usd',
            statusHint: 'succeeded',
            invoiceId: invoice.id,
        });

        const logger = (paymentHistory as any).logger;
        await paymentHistory.markInvoicePaidIfApplicable(invoice.id, 't1');
        expect(logger.log).toHaveBeenCalled();
        const lastCall = (logger.log as jest.Mock).mock.calls.pop()?.[0];
        expect(lastCall).toContain('PaymentInvoiceMismatch');
        const updated = await invoiceRepo.findById(invoice.id, 't1');
        expect(updated?.status).not.toBe('PAID');
    });

    it('blocks linking when tenant mismatch', async () => {
        const invoice = buildInvoice('t2', 500);
        await invoiceRepo.create(invoice);
        const payment = new Payment({
            id: 'p-1',
            tenantId: 't1',
            amount: 500,
            currency: 'usd',
            gateway: 'stripe',
            status: 'SUCCEEDED' as PaymentStatus,
            externalId: 'ext-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {},
        });
        await paymentRepo.create(payment);

        await expect(paymentHistory.linkPaymentToInvoice(payment.id, invoice.id, 't1')).rejects.toThrow();
    });
});
