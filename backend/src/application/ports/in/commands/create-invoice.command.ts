import { InvoiceStatus } from '../../../../domain/fees/entities/fee-invoice.entity';

export interface CreateInvoiceCommand {
  tenantId: string;
  studentId: string;
  studentName?: string;
  planId?: string;
  planName?: string;
  amount: number;
  currency: string;
  dueDate: Date;
  issuedDate?: Date;
  status?: InvoiceStatus;
  reference?: string;
  notes?: string;
}
