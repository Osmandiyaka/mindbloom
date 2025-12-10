import { Inject, Injectable } from '@nestjs/common';
import { FeeInvoice } from '../../../domain/fees/entities/fee-invoice.entity';
import { FEE_INVOICE_REPOSITORY, FeeInvoiceFilters, IFeeInvoiceRepository } from '../../../domain/ports/out/fee-invoice-repository.port';

@Injectable()
export class ListInvoicesUseCase {
  constructor(
    @Inject(FEE_INVOICE_REPOSITORY)
    private readonly invoices: IFeeInvoiceRepository,
  ) {}

  async execute(tenantId: string, filters: FeeInvoiceFilters = {}): Promise<FeeInvoice[]> {
    return this.invoices.findAll(tenantId, filters);
  }
}
