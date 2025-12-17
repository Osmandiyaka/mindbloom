import { Injectable, Logger } from '@nestjs/common';
import { EntitlementRepository } from '../../../domain/ports/out/entitlement-repository.port';
import { SubscriptionRepository } from '../../../domain/ports/out/subscription-repository.port';
import { PlanModule } from '../../../domain/subscription/entities/plan.entity';

@Injectable()
export class RecomputePlanEntitlementsService {
    private readonly logger = new Logger(RecomputePlanEntitlementsService.name);

    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly entitlementRepository: EntitlementRepository,
    ) { }

    async recompute(planId: string, modules: PlanModule[]): Promise<void> {
        const subscriptions = await this.subscriptionRepository.findByPlanId(planId);
        if (!subscriptions.length) {
            return;
        }

        const moduleKeys = modules.map((m) => m.moduleKey);
        const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');

        for (const sub of activeSubscriptions) {
            await this.entitlementRepository.upsertMany(sub.tenantId, planId, modules);
            await this.entitlementRepository.disableMissingModules(sub.tenantId, planId, moduleKeys);
            this.logger.log(`Entitlements updated for tenant ${sub.tenantId} from plan ${planId}`);
        }
    }
}
