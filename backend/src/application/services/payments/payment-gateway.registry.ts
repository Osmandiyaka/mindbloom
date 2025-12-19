import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from '../../../domain/ports/out/payment-gateway.port';
import { StripePaymentGateway } from './stripe-payment.gateway';

@Injectable()
export class PaymentGatewayRegistry {
    private readonly logger = new Logger(PaymentGatewayRegistry.name);

    constructor(
        private readonly configService: ConfigService,
        @Inject(StripePaymentGateway) private readonly stripeGateway: IPaymentGateway,
    ) { }

    getGateway(): IPaymentGateway {
        const provider = (this.configService.get<string>('PAYMENTS_PROVIDER') || 'stripe').toLowerCase();

        if (provider !== 'stripe') {
            this.logger.warn(`Payment provider "${provider}" not supported. Falling back to Stripe.`);
        }

        return this.stripeGateway;
    }
}
