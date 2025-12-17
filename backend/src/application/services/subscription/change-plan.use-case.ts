import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepository } from '../../../domain/ports/out/subscription-repository.port';
import { SubscriptionPlan, Subscription } from '../../../domain/subscription/entities/subscription.entity';
import { ChangePlanCommand } from '../../ports/in/commands/change-plan.command';

@Injectable()
export class ChangePlanUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    async execute(command: ChangePlanCommand): Promise<Subscription> {
        const current = await this.subscriptionRepository.findByTenantId(command.tenantId);
        const nextPlan = command.plan;

        if (current && current.plan === nextPlan) {
            throw new BadRequestException('Already on this plan');
        }

        const subscription = (current || Subscription.create(command.tenantId, command.billingEmail, nextPlan, command.planId || null))
            .changePlan(nextPlan, command.planId || null);

        const updated = await this.subscriptionRepository.save(new Subscription(
            subscription.id,
            subscription.tenantId,
            command.planId || subscription.planId || null,
            subscription.plan,
            subscription.status,
            subscription.currentPeriodEnd,
            command.billingEmail,
            command.paymentMethodLast4,
            command.paymentBrand,
            subscription.invoices,
            subscription.createdAt,
            new Date(),
        ));

        const invoice = {
            id: `inv_${Date.now()}`,
            amount: this.getPlanPrice(nextPlan),
            currency: 'USD',
            createdAt: new Date(),
            description: `Plan change to ${nextPlan}`,
            status: 'paid' as const,
        };

        const withInvoice = updated.addInvoice(invoice);
        return this.subscriptionRepository.save(withInvoice);
    }

    private getPlanPrice(plan: SubscriptionPlan): number {
        const prices: Record<SubscriptionPlan, number> = {
            free: 0,
            basic: 49,
            premium: 99,
            enterprise: 199,
        };
        return prices[plan];
    }
}
