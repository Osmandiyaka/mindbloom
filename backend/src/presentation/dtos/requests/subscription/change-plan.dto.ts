import { SubscriptionPlan } from '../../../../domain/subscription/entities/subscription.entity';

export class ChangePlanDto {
    planId?: string;
    plan!: SubscriptionPlan;
    billingEmail!: string;
    paymentMethodLast4?: string;
    paymentBrand?: string;
}
