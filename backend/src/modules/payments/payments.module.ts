import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { raw } from 'body-parser';
import { PaymentGatewayRegistry } from '../../application/services/payments/payment-gateway.registry';
import { StripePaymentGateway } from '../../application/services/payments/stripe-payment.gateway';
import { PAYMENT_GATEWAY } from '../../domain/ports/out/repository.tokens';
import { PluginsModule } from '../plugins/plugins.module';
import { PaymentWebhookController } from '../../presentation/controllers/payment-webhook.controller';

@Module({
    imports: [ConfigModule, PluginsModule],
    controllers: [PaymentWebhookController],
    providers: [
        StripePaymentGateway,
        PaymentGatewayRegistry,
        {
            provide: PAYMENT_GATEWAY,
            useFactory: (registry: PaymentGatewayRegistry) => registry.getGateway(),
            inject: [PaymentGatewayRegistry],
        },
    ],
    exports: [PAYMENT_GATEWAY, PaymentGatewayRegistry],
})
export class PaymentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(raw({ type: 'application/json' }))
            .forRoutes({ path: 'webhooks/payments/stripe', method: RequestMethod.POST }, PaymentWebhookController);
    }
}
