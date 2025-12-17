import { SubscriptionPlan } from '../../../../domain/subscription/entities/subscription.entity';

export class ChangePlanCommand {
    constructor(
        public readonly tenantId: string,
        public readonly planId: string | null,
        public readonly plan: SubscriptionPlan,
        public readonly billingEmail: string,
        public readonly paymentMethodLast4?: string,
        public readonly paymentBrand?: string,
    ) { }
}
