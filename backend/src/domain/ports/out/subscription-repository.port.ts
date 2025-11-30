import { Subscription } from '../../subscription/entities/subscription.entity';
import { SUBSCRIPTION_REPOSITORY } from './repository.tokens';

export interface SubscriptionRepository {
    findByTenantId(tenantId: string): Promise<Subscription | null>;
    save(subscription: Subscription): Promise<Subscription>;
}

export { SUBSCRIPTION_REPOSITORY } from './repository.tokens';
