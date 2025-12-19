import { BillingInvoice } from '../../billing/entities/invoice.entity';
import { BILLING_INVOICE_REPOSITORY } from './repository.tokens';

export interface BillingInvoiceRepository {
    create(invoice: BillingInvoice): Promise<BillingInvoice>;
    update(invoice: BillingInvoice): Promise<BillingInvoice>;
    findById(id: string, tenantId: string): Promise<BillingInvoice | null>;
    findByPeriod(tenantId: string, editionId: string | null, periodStart: Date, periodEnd: Date): Promise<BillingInvoice | null>;
    findByInvoiceNumber(invoiceNumber: string, tenantId: string): Promise<BillingInvoice | null>;
}

export { BILLING_INVOICE_REPOSITORY } from './repository.tokens';
