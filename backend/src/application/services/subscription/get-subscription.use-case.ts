import { Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepository } from '../../../domain/ports/out/subscription-repository.port';
import { Subscription } from '../../../domain/subscription/entities/subscription.entity';

@Injectable()
export class GetSubscriptionUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    async execute(tenantId: string, billingEmail: string): Promise<Subscription> {
        const existing = await this.subscriptionRepository.findByTenantId(tenantId);
        if (existing) return existing;
        const seed = Subscription.create(tenantId, billingEmail);
        return this.subscriptionRepository.save(seed);
    }
}
