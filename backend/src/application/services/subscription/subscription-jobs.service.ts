import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';
import { ITenantRepository, TENANT_REPOSITORY, TenantListQuery } from '../../../domain/ports/out/tenant-repository.port';
import { SubscriptionState, Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { ExpirationPolicyEngine } from './expiration-policy.engine';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { SubscriptionNotificationEvent, SubscriptionNotificationPayload } from './subscription-notification.events';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionJobsService {
    private readonly logger = new Logger(SubscriptionJobsService.name);
    private readonly expiringDedup = new Map<string, number>();
    private readonly dedupTtlMs = 14 * MS_PER_DAY; // dedupe window per subscription period

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly policyEngine: ExpirationPolicyEngine,
        private readonly lifecycle: SubscriptionLifecycleService,
        private readonly events: EventBus,
    ) { }

    @Cron('0 2 * * *', { name: 'notifyExpiringSubscriptionsJob' })
    async notifyExpiringSubscriptionsJob(now: Date = new Date()): Promise<void> {
        const windowDays = 45;
        const windowEnd = new Date(now.getTime() + windowDays * MS_PER_DAY);
        await this.paginateTenants({
            subscriptionStates: [SubscriptionState.ACTIVE, SubscriptionState.TRIALING, SubscriptionState.GRACE],
            subscriptionEndDateAfter: now,
            subscriptionEndDateBefore: windowEnd,
            pageSize: 100,
        }, async (tenant) => {
            if (!tenant.subscriptionEndDate) return;
            const policy = await this.policyEngine.getPolicyConfig(tenant.id);
            const daysLeft = Math.ceil((tenant.subscriptionEndDate.getTime() - now.getTime()) / MS_PER_DAY);
            if (daysLeft < 0) return;
            if (!policy.notifyDaysBeforeExpiry.includes(daysLeft)) return;

            const dedupKey = `${tenant.id}:${daysLeft}:${tenant.subscriptionEndDate.toISOString()}`;
            if (!this.shouldNotify(dedupKey, now)) return;

            const payload: SubscriptionNotificationPayload = {
                tenantId: tenant.id,
                editionId: tenant.editionId,
                previousState: tenant.subscriptionState,
                newState: tenant.subscriptionState,
                subscriptionEndDate: tenant.subscriptionEndDate,
                gracePeriodEndDate: tenant.gracePeriodEndDate,
                timestamp: now,
                metadata: { daysLeft },
            };

            this.events.publish(SubscriptionNotificationEvent.ExpiringSoon, payload, tenant.id);
            this.logger.log(JSON.stringify({ job: 'notifyExpiringSubscriptionsJob', tenantId: tenant.id, daysLeft }));
        });
    }

    @Cron('15 * * * *', { name: 'markPastDueJob' })
    async markPastDueJob(now: Date = new Date()): Promise<void> {
        await this.paginateTenants({
            subscriptionStates: [SubscriptionState.ACTIVE, SubscriptionState.TRIALING],
            subscriptionEndDateBefore: now,
            pageSize: 100,
        }, async (tenant) => {
            await this.lifecycle.evaluateTenantSubscriptionState(tenant.id, now);
        });
    }

    @Cron('30 * * * *', { name: 'enforceGracePolicyJob' })
    async enforceGracePolicyJob(now: Date = new Date()): Promise<void> {
        await this.paginateTenants({
            subscriptionStates: [SubscriptionState.PAST_DUE, SubscriptionState.GRACE],
            gracePeriodEndDateBefore: now,
            pageSize: 100,
        }, async (tenant) => {
            const decision = await this.policyEngine.evaluate(tenant.id, now);
            await this.policyEngine.applyDecision(decision, 'subscription-jobs');
        });
    }

    @Cron('0 3 * * 1', { name: 'subscriptionConsistencyJob' })
    async subscriptionConsistencyJob(now: Date = new Date()): Promise<void> {
        // Active but expired
        await this.paginateTenants({
            subscriptionStates: [SubscriptionState.ACTIVE],
            subscriptionEndDateBefore: now,
            pageSize: 100,
        }, async (tenant) => {
            this.events.publish(SubscriptionNotificationEvent.ConsistencyIssue, {
                tenantId: tenant.id,
                editionId: tenant.editionId,
                previousState: tenant.subscriptionState,
                newState: tenant.subscriptionState,
                subscriptionEndDate: tenant.subscriptionEndDate,
                gracePeriodEndDate: tenant.gracePeriodEndDate,
                timestamp: now,
                metadata: { reason: 'active_with_expired_subscription' },
            }, tenant.id);
        });

        // Suspended but future end date
        await this.paginateTenants({
            subscriptionStates: [SubscriptionState.SUSPENDED],
            subscriptionEndDateAfter: now,
            pageSize: 100,
        }, async (tenant) => {
            this.events.publish(SubscriptionNotificationEvent.ConsistencyIssue, {
                tenantId: tenant.id,
                editionId: tenant.editionId,
                previousState: tenant.subscriptionState,
                newState: tenant.subscriptionState,
                subscriptionEndDate: tenant.subscriptionEndDate,
                gracePeriodEndDate: tenant.gracePeriodEndDate,
                timestamp: now,
                metadata: { reason: 'suspended_with_future_subscription' },
            }, tenant.id);
        });
    }

    private shouldNotify(key: string, now: Date): boolean {
        const expiresAt = this.expiringDedup.get(key) || 0;
        if (expiresAt > now.getTime()) {
            return false;
        }
        this.expiringDedup.set(key, now.getTime() + this.dedupTtlMs);
        return true;
    }

    private async paginateTenants(query: TenantListQuery, handler: (tenant: Tenant) => Promise<void>): Promise<void> {
        let page = 1;
        const pageSize = query.pageSize || 50;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result = await this.tenants.findWithFilters({ ...query, page, pageSize });
            if (!result.data || result.data.length === 0) break;
            for (const tenant of result.data) {
                await handler(tenant);
            }
            if (result.data.length < pageSize) break;
            page += 1;
        }
    }
}
