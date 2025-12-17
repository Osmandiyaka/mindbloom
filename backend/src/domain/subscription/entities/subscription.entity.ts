export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    createdAt: Date;
    description: string;
    status: 'paid' | 'open' | 'void';
}

export class Subscription {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly planId: string | null,
        public readonly plan: SubscriptionPlan,
        public readonly status: SubscriptionStatus,
        public readonly currentPeriodEnd: Date,
        public readonly billingEmail: string,
        public readonly paymentMethodLast4?: string,
        public readonly paymentBrand?: string,
        public readonly invoices: Invoice[] = [],
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }

    static create(tenantId: string, billingEmail: string, plan: SubscriptionPlan = 'free', planId: string | null = null): Subscription {
        return new Subscription(
            '',
            tenantId,
            planId,
            plan,
            'active',
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingEmail,
            undefined,
            undefined,
            [],
            new Date(),
            new Date(),
        );
    }

    changePlan(plan: SubscriptionPlan, planId: string | null = null): Subscription {
        return new Subscription(
            this.id,
            this.tenantId,
            planId,
            plan,
            'active',
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            this.billingEmail,
            this.paymentMethodLast4,
            this.paymentBrand,
            this.invoices,
            this.createdAt,
            new Date(),
        );
    }

    addInvoice(invoice: Invoice): Subscription {
        return new Subscription(
            this.id,
            this.tenantId,
            this.planId,
            this.plan,
            this.status,
            this.currentPeriodEnd,
            this.billingEmail,
            this.paymentMethodLast4,
            this.paymentBrand,
            [invoice, ...this.invoices],
            this.createdAt,
            new Date(),
        );
    }
}
