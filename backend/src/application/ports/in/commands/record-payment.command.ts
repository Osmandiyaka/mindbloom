import { PaymentMethod, PaymentStatus } from '../../../../domain/fees/entities/fee-payment.entity';

export interface RecordPaymentCommand {
  tenantId: string;
  invoiceId: string;
  studentId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: PaymentStatus;
  paidAt?: Date;
  recordedBy?: string;
}
