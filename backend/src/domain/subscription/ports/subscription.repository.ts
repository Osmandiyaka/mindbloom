import { Subscription } from '../entities/subscription.entity';

export const SUBSCRIPTION_REPOSITORY = 'SUBSCRIPTION_REPOSITORY';

export interface SubscriptionRepository {
    findByTenantId(tenantId: string): Promise<Subscription | null>;
    save(subscription: Subscription): Promise<Subscription>;
}
