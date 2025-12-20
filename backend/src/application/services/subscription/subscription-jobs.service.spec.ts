import { expect, jest } from '@jest/globals';
import { SubscriptionJobsService } from './subscription-jobs.service';
import { SubscriptionNotificationEvent } from './subscription-notification.events';
import { SubscriptionState, TenantStatus, Tenant, WeekStart } from '../../../domain/tenant/entities/tenant.entity';
import { TenantListResult } from '../../../domain/ports/out/tenant-repository.port';

function makeTenant(overrides: Partial<Tenant>): Tenant {
    const tenant = Tenant.create({
        name: 'Test School',
        subdomain: 'tenant',
        contactEmail: 'a@test.com',
        metadata: overrides.metadata || { editionCode: overrides.editionId ?? 'paid-edition' },
        status: TenantStatus.ACTIVE,
        limits: overrides.limits || { maxStudents: 100, maxTeachers: 10, maxClasses: 5 },
    });
    (tenant as any).id = overrides.id || 'tenant-1';
    (tenant as any).usage = overrides.usage || tenant.usage;
    (tenant as any).trialEndsAt = overrides.trialEndsAt;
    (tenant as any).subscriptionState = overrides.subscriptionState ?? SubscriptionState.ACTIVE;
    (tenant as any).subscriptionEndDate = overrides.subscriptionEndDate;
    (tenant as any).isSuspended = overrides.isSuspended ?? false;
    (tenant as any).gracePeriodEndDate = overrides.gracePeriodEndDate;
    (tenant as any).suspendedAt = overrides.suspendedAt;
    (tenant as any).expirationPolicy = overrides.expirationPolicy;
    return tenant;
}

describe('SubscriptionJobsService', () => {
    let tenants: { findWithFilters: jest.MockedFunction<(query: any) => Promise<TenantListResult>> };
    let policyEngine: {
        getPolicyConfig: jest.MockedFunction<(tenantId: string) => Promise<any>>;
        evaluate: jest.MockedFunction<(tenantId: string, now?: Date) => Promise<any>>;
        applyDecision: jest.MockedFunction<(decision: any, actor?: string) => Promise<any>>;
    };
    let lifecycle: { evaluateTenantSubscriptionState: jest.MockedFunction<(tenantId: string, now?: Date) => Promise<any>> };
    let events: { publish: jest.Mock };
    let service: SubscriptionJobsService;

    beforeEach(() => {
        tenants = { findWithFilters: jest.fn() };
        policyEngine = { getPolicyConfig: jest.fn(), evaluate: jest.fn(), applyDecision: jest.fn() };
        lifecycle = { evaluateTenantSubscriptionState: jest.fn() } as any;
        events = { publish: jest.fn() } as any;
        service = new SubscriptionJobsService(tenants as any, policyEngine as any, lifecycle as any, events as any);
    });

    it('emits expiring soon notifications when within window', async () => {
        const now = new Date();
        const tenant = makeTenant({ id: 'tenant-exp', subscriptionEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) });
        tenants.findWithFilters.mockResolvedValueOnce({ data: [tenant], total: 1, page: 1, pageSize: 100 } as TenantListResult)
            .mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 100 });
        policyEngine.getPolicyConfig.mockResolvedValue({ notifyDaysBeforeExpiry: [7] });

        await service.notifyExpiringSubscriptionsJob(now);
        expect(events.publish).toHaveBeenCalledWith(SubscriptionNotificationEvent.ExpiringSoon, expect.any(Object), tenant.id);
    });

    it('marks past due tenants by invoking lifecycle evaluation', async () => {
        const tenant = makeTenant({ id: 'tenant-past', subscriptionState: SubscriptionState.ACTIVE, subscriptionEndDate: new Date(Date.now() - 1000) });
        tenants.findWithFilters.mockResolvedValueOnce({ data: [tenant], total: 1, page: 1, pageSize: 100 } as TenantListResult)
            .mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 100 });

        await service.markPastDueJob(new Date());
        expect(lifecycle.evaluateTenantSubscriptionState).toHaveBeenCalledWith('tenant-past', expect.any(Date));
    });

    it('enforces grace policy decisions', async () => {
        const tenant = makeTenant({ id: 'tenant-grace', subscriptionState: SubscriptionState.GRACE, gracePeriodEndDate: new Date(Date.now() - 1000) });
        tenants.findWithFilters.mockResolvedValueOnce({ data: [tenant], total: 1, page: 1, pageSize: 100 } as TenantListResult)
            .mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 100 });
        policyEngine.evaluate.mockResolvedValue({ tenantId: tenant.id, actionToApply: 'SUSPEND' });

        await service.enforceGracePolicyJob(new Date());
        expect(policyEngine.applyDecision).toHaveBeenCalledWith(expect.objectContaining({ tenantId: tenant.id }), 'subscription-jobs');
    });

    it('reports consistency issues', async () => {
        const activeExpired = makeTenant({ id: 'tenant-active-expired', subscriptionState: SubscriptionState.ACTIVE, subscriptionEndDate: new Date(Date.now() - 1000) });
        const suspendedFuture = makeTenant({ id: 'tenant-suspended-future', subscriptionState: SubscriptionState.SUSPENDED, subscriptionEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) });
        tenants.findWithFilters
            .mockResolvedValueOnce({ data: [activeExpired], total: 1, page: 1, pageSize: 100 } as TenantListResult)
            .mockResolvedValueOnce({ data: [suspendedFuture], total: 1, page: 1, pageSize: 100 } as TenantListResult);

        await service.subscriptionConsistencyJob(new Date());
        expect(events.publish).toHaveBeenCalledWith(SubscriptionNotificationEvent.ConsistencyIssue, expect.any(Object), activeExpired.id);
        expect(events.publish).toHaveBeenCalledWith(SubscriptionNotificationEvent.ConsistencyIssue, expect.any(Object), suspendedFuture.id);
    });
});
