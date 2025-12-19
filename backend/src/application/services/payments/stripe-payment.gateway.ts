import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
    CheckoutSession,
    CreateCheckoutSessionInput,
    IPaymentGateway,
    PaymentGatewayName,
    PaymentStatus,
    WebhookVerificationResult,
} from '../../../domain/ports/out/payment-gateway.port';

@Injectable()
export class StripePaymentGateway implements IPaymentGateway {
    readonly name: PaymentGatewayName = 'stripe';
    private readonly stripe: Stripe;
    private readonly logger = new Logger(StripePaymentGateway.name);

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }

        this.stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    }

    async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            line_items: [
                {
                    price_data: {
                        currency: input.currency,
                        unit_amount: input.priceCents,
                        product_data: {
                            name: `Subscription: ${input.planId}`,
                        },
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                tenantId: input.tenantId,
                userId: input.userId,
                planId: input.planId,
            },
        });

        if (!session.url) {
            this.logger.warn(`Stripe returned session without url. sessionId=${session.id}`);
        }

        return {
            id: session.id,
            url: session.url ?? '',
        };
    }

    async verifyWebhook(payload: Buffer | string, signature: string | undefined): Promise<WebhookVerificationResult> {
        const signingSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!signingSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
        }
        if (!signature) {
            throw new Error('Missing Stripe signature header');
        }

        const event = this.stripe.webhooks.constructEvent(payload, signature, signingSecret);
        return {
            eventId: event.id,
            type: event.type,
            payload: event.data.object,
        };
    }

    async getPaymentStatus(referenceId: string): Promise<PaymentStatus> {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(referenceId);
        return this.mapPaymentIntentStatus(paymentIntent.status);
    }

    private mapPaymentIntentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
        switch (status) {
            case 'succeeded':
                return 'succeeded';
            case 'canceled':
                return 'canceled';
            case 'requires_payment_method':
            case 'requires_confirmation':
            case 'requires_action':
            case 'processing':
            case 'requires_capture':
                return 'pending';
            default:
                this.logger.warn(`Unknown Stripe payment intent status received: ${status}`);
                return 'pending';
        }
    }
}
