import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { FeeInvoice, FeeInvoiceProps } from '../../../domain/fees/entities/fee-invoice.entity';
import { FEE_INVOICE_REPOSITORY, IFeeInvoiceRepository } from '../../../domain/ports/out/fee-invoice-repository.port';
import { CreateInvoiceCommand } from '../../ports/in/commands/create-invoice.command';

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    @Inject(FEE_INVOICE_REPOSITORY)
    private readonly invoices: IFeeInvoiceRepository,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<FeeInvoice> {
    const invoiceId = new Types.ObjectId().toString();
    const now = new Date();
    const props: FeeInvoiceProps = {
      id: invoiceId,
      tenantId: command.tenantId,
      studentId: command.studentId,
      studentName: command.studentName,
      planId: command.planId,
      planName: command.planName,
      amount: command.amount,
      currency: command.currency,
      issuedDate: command.issuedDate ? new Date(command.issuedDate) : now,
      dueDate: new Date(command.dueDate),
      paidAmount: 0,
      status: command.status || 'issued',
      reference: command.reference,
      notes: command.notes,
      lastPaymentAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    const invoice = new FeeInvoice(props);
    return this.invoices.create(invoice);
  }
}
