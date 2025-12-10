import { FeeInvoice, InvoiceStatus } from '../../fees/entities/fee-invoice.entity';

export interface FeeInvoiceFilters {
  studentId?: string;
  status?: InvoiceStatus;
  dueFrom?: Date;
  dueTo?: Date;
}

export const FEE_INVOICE_REPOSITORY = 'FEE_INVOICE_REPOSITORY';

export interface IFeeInvoiceRepository {
  create(invoice: FeeInvoice): Promise<FeeInvoice>;
  findById(id: string, tenantId: string): Promise<FeeInvoice | null>;
  findAll(tenantId: string, filters?: FeeInvoiceFilters): Promise<FeeInvoice[]>;
  update(invoice: FeeInvoice): Promise<FeeInvoice>;
}
