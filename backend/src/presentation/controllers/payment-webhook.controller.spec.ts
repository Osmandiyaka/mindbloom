import { PaymentWebhookController } from './payment-webhook.controller';
import { PlatformEvent } from '../../core/plugins/event-bus.service';

describe('PaymentWebhookController', () => {
    const publish = jest.fn();
    const eventBus = { publish } as any;

    const verifyWebhook = jest.fn();
    const gateway = { verifyWebhook } as any;
    const registry = { getGateway: jest.fn(() => gateway) } as any;

    beforeEach(() => {
        publish.mockClear();
        verifyWebhook.mockReset();
        registry.getGateway.mockClear();
    });

    it('publishes success event when payment succeeds', async () => {
        verifyWebhook.mockResolvedValue({
            type: 'invoice.payment_succeeded',
            payload: { metadata: { tenantId: 'tenant-123' } },
            eventId: 'evt_123',
        });

        const controller = new PaymentWebhookController(registry, eventBus);
        await controller.handleStripeWebhook({
            headers: { 'stripe-signature': 'sig' },
            body: Buffer.from('payload'),
        } as any);

        expect(registry.getGateway).toHaveBeenCalled();
        expect(publish).toHaveBeenCalledWith(PlatformEvent.SUBSCRIPTION_PAYMENT_SUCCEEDED, expect.anything(), 'tenant-123');
    });

    it('ignores events without tenant context', async () => {
        verifyWebhook.mockResolvedValue({
            type: 'invoice.payment_succeeded',
            payload: {},
            eventId: 'evt_123',
        });

        const controller = new PaymentWebhookController(registry, eventBus);
        await controller.handleStripeWebhook({
            headers: { 'stripe-signature': 'sig' },
            body: Buffer.from('payload'),
        } as any);

        expect(publish).not.toHaveBeenCalled();
    });
});
