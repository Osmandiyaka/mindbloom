import { expect, jest } from '@jest/globals';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant, SubscriptionState, TenantPlan, TenantStatus, WeekStart } from '../../../domain/tenant/entities/tenant.entity';
import { EventBus } from '../../../core/plugins/event-bus.service';

class InMemoryTenantRepository implements ITenantRepository {
    private store = new Map<string, Tenant>();

    constructor(seed: Tenant[]) {
        seed.forEach(t => this.store.set(t.id, t));
    }

    async findAll(): Promise<Tenant[]> { return Array.from(this.store.values()); }
    async findById(id: string): Promise<Tenant | null> { return this.store.get(id) || null; }
    async findBySubdomain(subdomain: string): Promise<Tenant | null> { return Array.from(this.store.values()).find(t => t.subdomain === subdomain) || null; }
    async findByCustomDomain(_customDomain: string): Promise<Tenant | null> { return null; }
    async findWithFilters(query: TenantListQuery): Promise<TenantListResult> {
        const data = Array.from(this.store.values());
        const page = query.page || 1;
        const pageSize = query.pageSize || data.length || 1;
        return { data, total: data.length, page, pageSize };
    }
    async create(tenant: Tenant): Promise<Tenant> { this.store.set(tenant.id, tenant); return tenant; }
    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const existing = this.store.get(id);
        if (!existing) throw new Error('Tenant not found');
        const updated = { ...existing, ...data } as Tenant;
        this.store.set(id, updated);
        return updated;
    }
    async delete(id: string): Promise<void> { this.store.delete(id); }
}

function makeTenant(overrides: Partial<Tenant>): Tenant {
    return new Tenant(
        overrides.id || 't-1',
        'Test School',
        'test',
        TenantStatus.ACTIVE,
        TenantPlan.TRIAL,
        null,
        { email: 'a@test.com' },
        { maxStudents: 100, maxTeachers: 10, maxClasses: 5 },
        undefined,
        [],
        undefined,
        undefined,
        overrides.trialEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        undefined,
        'en',
        'UTC',
        WeekStart.MONDAY,
        'USD',
        undefined,
        [],
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        overrides.suspendedAt,
        overrides.suspensionReason,
        overrides.deletedAt,
        overrides.statusHistory,
        overrides.tags,
        overrides.idTemplates,
        overrides.createdAt,
        overrides.updatedAt,
        overrides.edition ?? undefined,
        overrides.editionId,
        overrides.subscriptionEndDate,
        overrides.isSuspended ?? false,
        overrides.gracePeriodEndDate,
        overrides.subscriptionState ?? SubscriptionState.TRIALING,
        overrides.subscriptionStartDate,
        overrides.pastDueSince,
        overrides.trialEndDate,
        overrides.graceStartedAt,
        overrides.deactivatedAt,
        overrides.lastPaymentFailureAt,
        overrides.lastPaymentSuccessAt,
        overrides.lastInvoiceId,
        overrides.stateVersion ?? 1,
    );
}

describe('SubscriptionLifecycleService', () => {
    const features: jest.Mocked<{ getInt: (tenantId: string, key: string) => Promise<number> }> = { getInt: jest.fn(async () => 7) };
    const events: EventBus = { publish: jest.fn() } as any;

    const freshService = (tenant: Tenant) => new SubscriptionLifecycleService(new InMemoryTenantRepository([tenant]), features as any, events as any);

    beforeEach(() => {
        jest.clearAllMocks();
        features.getInt.mockResolvedValue(7);
    });

    it('moves trialing to past due when trial ends', async () => {
        const trialEnded = makeTenant({
            subscriptionState: SubscriptionState.TRIALING,
            trialEndDate: new Date(Date.now() - 1000),
        });
        const service = freshService(trialEnded);

        await service.evaluateTenantSubscriptionState(trialEnded.id, new Date());

        const updated = await service.getTenantSubscriptionSnapshot(trialEnded.id);
        expect(updated.state).toBe(SubscriptionState.PAST_DUE);
        expect((events.publish as jest.Mock)).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ previousState: SubscriptionState.TRIALING, newState: SubscriptionState.PAST_DUE }), trialEnded.id);
    });

    it('payment success moves past due to active and sets end date', async () => {
        const pastDue = makeTenant({
            subscriptionState: SubscriptionState.PAST_DUE,
            pastDueSince: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });
        const service = freshService(pastDue);

        const paidThroughDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        await service.onPaymentSuccess(pastDue.id, { paidThroughDate, invoiceId: 'inv_1' });

        const updated = await service.getTenantSubscriptionSnapshot(pastDue.id);
        expect(updated.state).toBe(SubscriptionState.ACTIVE);
        expect(updated.subscriptionEndDate?.getTime()).toBe(paidThroughDate.getTime());
    });

    it('payment failure moves active to past due and sets pastDueSince', async () => {
        features.getInt.mockResolvedValue(3);
        const active = makeTenant({ subscriptionState: SubscriptionState.ACTIVE });
        const service = freshService(active);

        const failedAt = new Date();
        await service.onPaymentFailure(active.id, { failedAt, invoiceId: 'inv_2' });

        const updated = await service.getTenantSubscriptionSnapshot(active.id);
        expect(updated.state).toBe(SubscriptionState.PAST_DUE);
        expect(updated.pastDueSince?.getTime()).toBe(failedAt.getTime());
    });

    it('moves past due to suspended when grace ends', async () => {
        const pastDue = makeTenant({
            subscriptionState: SubscriptionState.PAST_DUE,
            gracePeriodEndDate: new Date(Date.now() - 1000),
            pastDueSince: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        });
        const service = freshService(pastDue);

        await service.evaluateTenantSubscriptionState(pastDue.id, new Date());

        const updated = await service.getTenantSubscriptionSnapshot(pastDue.id);
        expect(updated.state).toBe(SubscriptionState.SUSPENDED);
    });

    it('does not reactivate deactivated tenant on payment success', async () => {
        const deactivated = makeTenant({ subscriptionState: SubscriptionState.DEACTIVATED, deactivatedAt: new Date() });
        const service = freshService(deactivated);

        await service.onPaymentSuccess(deactivated.id, { paidThroughDate: new Date(), invoiceId: 'inv_3' });

        const snapshot = await service.getTenantSubscriptionSnapshot(deactivated.id);
        expect(snapshot.state).toBe(SubscriptionState.DEACTIVATED);
        expect((events.publish as jest.Mock)).not.toHaveBeenCalled();
    });

    it('is idempotent for evaluation without new transitions', async () => {
        const active = makeTenant({ subscriptionState: SubscriptionState.ACTIVE });
        const service = freshService(active);

        await service.evaluateTenantSubscriptionState(active.id, new Date());
        await service.evaluateTenantSubscriptionState(active.id, new Date());

        expect((events.publish as jest.Mock)).toHaveBeenCalledTimes(0);
    });
});
