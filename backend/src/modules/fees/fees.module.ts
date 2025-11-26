import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeePlansController } from './plans.controller';
import { InvoicesController } from './invoices.controller';
import { FeePlansService } from './plans.service';
import { InvoicesService } from './invoices.service';
import { FeePlanSchema } from '../../infrastructure/persistence/mongoose/schemas/fee-plan.schema';
import { InvoiceSchema } from '../../infrastructure/persistence/mongoose/schemas/invoice.schema';
import { PaymentSchema } from '../../infrastructure/persistence/mongoose/schemas/payment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'FeePlan', schema: FeePlanSchema },
            { name: 'Invoice', schema: InvoiceSchema },
            { name: 'Payment', schema: PaymentSchema },
        ]),
    ],
    controllers: [FeePlansController, InvoicesController],
    providers: [FeePlansService, InvoicesService],
    exports: [FeePlansService, InvoicesService],
})
export class FeesModule { }
