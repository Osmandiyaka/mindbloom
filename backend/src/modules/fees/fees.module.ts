import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesController } from './invoices.controller';
import { FeePlanSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/fee-plan.schema';
import { InvoiceSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/invoice.schema';
import { PaymentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/payment.schema';
import { AccountingModule } from '../accounting/accounting.module';
import { CreateInvoiceUseCase } from '../../application/services/fees/create-invoice.use-case';
import { ListInvoicesUseCase } from '../../application/services/fees/list-invoices.use-case';
import { RecordPaymentUseCase } from '../../application/services/fees/record-payment.use-case';
import { FEE_INVOICE_REPOSITORY } from '../../domain/ports/out/fee-invoice-repository.port';
import { FEE_PAYMENT_REPOSITORY } from '../../domain/ports/out/fee-payment-repository.port';
import { MongooseFeeInvoiceRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-fee-invoice.repository';
import { MongooseFeePaymentRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-fee-payment.repository';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'FeePlan', schema: FeePlanSchema },
            { name: 'Invoice', schema: InvoiceSchema },
            { name: 'Payment', schema: PaymentSchema },
        ]),
        AccountingModule,
    ],
    controllers: [InvoicesController],
    providers: [
        {
            provide: FEE_INVOICE_REPOSITORY,
            useClass: MongooseFeeInvoiceRepository,
        },
        {
            provide: FEE_PAYMENT_REPOSITORY,
            useClass: MongooseFeePaymentRepository,
        },
        CreateInvoiceUseCase,
        ListInvoicesUseCase,
        RecordPaymentUseCase,
    ],
    exports: [FEE_INVOICE_REPOSITORY, FEE_PAYMENT_REPOSITORY],
})
export class FeesModule { }
