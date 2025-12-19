import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { raw } from 'body-parser';
import { PaymentGatewayRegistry } from '../../application/services/payments/payment-gateway.registry';
import { StripePaymentGateway } from '../../application/services/payments/stripe-payment.gateway';
import { InvoiceService } from '../../application/services/payments/invoice.service';
import { PaymentHistoryService } from '../../application/services/payments/payment-history.service';
import { BILLING_INVOICE_REPOSITORY, PAYMENT_GATEWAY, PAYMENT_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { PluginsModule } from '../plugins/plugins.module';
import { PaymentWebhookController } from '../../presentation/controllers/payment-webhook.controller';
import { BillingPaymentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/billing-payment.schema';
import { BillingInvoiceSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/billing-invoice.schema';
import { MongooseBillingPaymentRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-billing-payment.repository';
import { MongooseBillingInvoiceRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-billing-invoice.repository';

@Module({
    imports: [
        ConfigModule,
        PluginsModule,
        MongooseModule.forFeature([
            { name: 'BillingPayment', schema: BillingPaymentSchema },
            { name: 'BillingInvoice', schema: BillingInvoiceSchema },
        ]),
    ],
    controllers: [PaymentWebhookController],
    providers: [
        StripePaymentGateway,
        PaymentGatewayRegistry,
        PaymentHistoryService,
        InvoiceService,
        { provide: PAYMENT_REPOSITORY, useClass: MongooseBillingPaymentRepository },
        { provide: BILLING_INVOICE_REPOSITORY, useClass: MongooseBillingInvoiceRepository },
        {
            provide: PAYMENT_GATEWAY,
            useFactory: (registry: PaymentGatewayRegistry) => registry.getGateway(),
            inject: [PaymentGatewayRegistry],
        },
    ],
    exports: [PAYMENT_GATEWAY, PaymentGatewayRegistry, PaymentHistoryService, InvoiceService, PAYMENT_REPOSITORY, BILLING_INVOICE_REPOSITORY],
})
export class PaymentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(raw({ type: 'application/json' }))
            .forRoutes({ path: 'webhooks/payments/stripe', method: RequestMethod.POST }, PaymentWebhookController);
    }
}
