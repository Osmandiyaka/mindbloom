import { expect, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripePaymentGateway } from './stripe-payment.gateway';

jest.mock('stripe', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: jest.fn(),
            },
        },
        paymentIntents: {
            retrieve: jest.fn(),
        },
        webhooks: {
            constructEvent: jest.fn(),
        },
    })),
}));

describe('StripePaymentGateway', () => {
    const stripeInstance = () => {
        const results = (Stripe as jest.MockedClass<typeof Stripe>).mock.results;
        return results[results.length - 1]?.value as any;
    };

    const config = {
        get: jest.fn((key: string) => {
            if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
            if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_123';
            return undefined;
        }),
    } as unknown as ConfigService;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates checkout session with tenant metadata', async () => {
        const gateway = new StripePaymentGateway(config);
        stripeInstance().checkout.sessions.create.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/cs_test' });

        const session = await gateway.createCheckoutSession({
            tenantId: 'tenant-1',
            userId: 'user-1',
            planId: 'plan-pro',
            priceCents: 2500,
            currency: 'usd',
            successUrl: 'https://app/success',
            cancelUrl: 'https://app/cancel',
        });

        expect(session).toEqual({ id: 'cs_test', url: 'https://checkout.stripe.com/cs_test' });
        expect(stripeInstance().checkout.sessions.create).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: 'subscription',
                metadata: { tenantId: 'tenant-1', userId: 'user-1', planId: 'plan-pro' },
            }),
        );
    });

    it('verifies webhook with signature', async () => {
        const gateway = new StripePaymentGateway(config);
        const mockEvent = { id: 'evt_1', type: 'invoice.payment_succeeded', data: { object: { ok: true } } } as any;
        stripeInstance().webhooks.constructEvent.mockReturnValue(mockEvent);

        const result = await gateway.verifyWebhook(Buffer.from('payload'), 'sig_header');

        expect(stripeInstance().webhooks.constructEvent).toHaveBeenCalledWith(Buffer.from('payload'), 'sig_header', 'whsec_123');
        expect(result).toEqual({ eventId: 'evt_1', type: 'invoice.payment_succeeded', payload: { ok: true } });
    });

    it('maps payment intent status to payment status', async () => {
        const gateway = new StripePaymentGateway(config);
        stripeInstance().paymentIntents.retrieve.mockResolvedValue({ status: 'succeeded' });

        const status = await gateway.getPaymentStatus('pi_123');

        expect(status).toBe('succeeded');
        expect(stripeInstance().paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
    });
});
