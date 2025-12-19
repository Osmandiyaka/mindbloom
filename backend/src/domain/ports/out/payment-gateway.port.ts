export type PaymentGatewayName = 'stripe';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

export interface CheckoutSession {
    id: string;
    url: string;
}

export interface WebhookVerificationResult {
    eventId: string;
    type: string;
    payload: any;
}

export interface CreateCheckoutSessionInput {
    tenantId: string;
    userId: string;
    planId: string;
    priceCents: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
}

export interface IPaymentGateway {
    readonly name: PaymentGatewayName;
    createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;
    verifyWebhook(payload: Buffer | string, signature: string | undefined): Promise<WebhookVerificationResult>;
    getPaymentStatus(referenceId: string): Promise<PaymentStatus>;
}
