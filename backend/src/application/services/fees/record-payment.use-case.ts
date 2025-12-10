import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FeePayment, FeePaymentProps } from '../../../domain/fees/entities/fee-payment.entity';
import { FeeInvoice } from '../../../domain/fees/entities/fee-invoice.entity';
import { FEE_INVOICE_REPOSITORY, IFeeInvoiceRepository } from '../../../domain/ports/out/fee-invoice-repository.port';
import { FEE_PAYMENT_REPOSITORY, IFeePaymentRepository } from '../../../domain/ports/out/fee-payment-repository.port';
import { RecordPaymentCommand } from '../../ports/in/commands/record-payment.command';

@Injectable()
export class RecordPaymentUseCase {
  constructor(
    @Inject(FEE_INVOICE_REPOSITORY)
    private readonly invoices: IFeeInvoiceRepository,
    @Inject(FEE_PAYMENT_REPOSITORY)
    private readonly payments: IFeePaymentRepository,
  ) {}

  async execute(command: RecordPaymentCommand): Promise<{ invoice: FeeInvoice; payment: FeePayment }> {
    const invoice = await this.invoices.findById(command.invoiceId, command.tenantId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const now = new Date();
    const paymentProps: FeePaymentProps = {
      id: new Types.ObjectId().toString(),
      invoiceId: command.invoiceId,
      tenantId: command.tenantId,
      studentId: command.studentId,
      amount: command.amount,
      currency: command.currency,
      method: command.method,
      reference: command.reference,
      notes: command.notes,
      status: command.status || 'completed',
      paidAt: command.paidAt ? new Date(command.paidAt) : now,
      recordedBy: command.recordedBy,
      createdAt: now,
      updatedAt: now,
    };

    const payment = new FeePayment(paymentProps);
    const savedPayment = await this.payments.create(payment);

    invoice.recordPayment(payment.amount, payment.paidAt);
    const updatedInvoice = await this.invoices.update(invoice);

    return { invoice: updatedInvoice, payment: savedPayment };
  }
}
