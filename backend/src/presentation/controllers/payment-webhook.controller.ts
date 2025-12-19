import { BadRequestException, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentGatewayRegistry } from '../../application/services/payments/payment-gateway.registry';
import { EventBus, PlatformEvent } from '../../core/plugins/event-bus.service';

@Controller('webhooks/payments')
export class PaymentWebhookController {
    constructor(
        private readonly paymentGatewayRegistry: PaymentGatewayRegistry,
        private readonly eventBus: EventBus,
    ) { }

    @Post('stripe')
    @HttpCode(200)
    async handleStripeWebhook(@Req() req: Request) {
        try {
            const signature = req.headers['stripe-signature'] as string | undefined;
            const rawBody = this.extractRawBody(req);

            const gateway = this.paymentGatewayRegistry.getGateway();
            const verification = await gateway.verifyWebhook(rawBody, signature);
            const payload: any = verification.payload ?? {};
            const tenantId = payload.metadata?.tenantId || payload.tenantId || payload.customer?.tenantId;

            if (tenantId) {
                if (verification.type === 'invoice.payment_succeeded' || verification.type === 'checkout.session.completed') {
                    this.eventBus.publish(PlatformEvent.SUBSCRIPTION_PAYMENT_SUCCEEDED, payload, tenantId);
                } else if (verification.type === 'invoice.payment_failed') {
                    this.eventBus.publish(PlatformEvent.SUBSCRIPTION_PAYMENT_FAILED, payload, tenantId);
                }
            }

            return { received: true };
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Webhook verification failed');
        }
    }

    private extractRawBody(req: Request): Buffer {
        const body = (req as any).rawBody ?? req.body;
        if (Buffer.isBuffer(body)) {
            return body;
        }

        if (typeof body === 'string') {
            return Buffer.from(body);
        }

        return Buffer.from(JSON.stringify(body || {}));
    }
}
