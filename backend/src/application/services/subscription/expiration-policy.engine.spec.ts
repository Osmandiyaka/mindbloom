import { expect, jest } from '@jest/globals';
import { ExpirationPolicyEngine, ExpirationPolicyConfig, PolicyDecision } from './expiration-policy.engine';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant, SubscriptionState, TenantStatus, WeekStart } from '../../../domain/tenant/entities/tenant.entity';
import { EventBus } from '../../../core/plugins/event-bus.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

class InMemoryTenantRepository implements ITenantRepository {
    constructor(private readonly store: Map<string, Tenant>) { }

    async findAll(): Promise<Tenant[]> { return Array.from(this.store.values()); }
    async findById(id: string): Promise<Tenant | null> { return this.store.get(id) || null; }
    async findBySubdomain(_subdomain: string): Promise<Tenant | null> { return null; }
    async findByCustomDomain(_customDomain: string): Promise<Tenant | null> { return null; }
    async findWithFilters(_query: TenantListQuery): Promise<TenantListResult> { return { data: [], total: 0, page: 1, pageSize: 10 }; }
    async create(tenant: Tenant): Promise<Tenant> { this.store.set(tenant.id, tenant); return tenant; }
    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const existing = this.store.get(id);
        if (!existing) throw new Error('Tenant not found');
        Object.assign(existing as any, data);
        this.store.set(id, existing);
        return existing;
    }
    async delete(id: string): Promise<void> { this.store.delete(id); }
}

function makeTenant(overrides: Partial<Tenant>): Tenant {
    return new Tenant(
        overrides.id || 't-1',
        'Test School',
        'test',
        TenantStatus.ACTIVE,
        overrides.ownerId || null,
        { email: 'a@test.com' },
        { maxStudents: 100, maxTeachers: 10, maxClasses: 5 },
        undefined,
        [],
        undefined,
        undefined,
        overrides.trialEndsAt,
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
        overrides.dataRetentionDays,
        overrides.lastLoginAt,
        overrides.onboardingCompletedAt,
        overrides.suspendedAt,
        overrides.suspensionReason,
        overrides.deletedAt,
        overrides.statusHistory,
        overrides.tags,
        overrides.idTemplates,
        overrides.createdAt,
        overrides.updatedAt,
        overrides.editionId ?? 'paid-edition',
        overrides.subscriptionEndDate,
        overrides.isSuspended ?? false,
        overrides.gracePeriodEndDate,
        overrides.subscriptionState ?? SubscriptionState.ACTIVE,
        overrides.subscriptionStartDate,
        overrides.pastDueSince,
        overrides.trialEndDate,
        overrides.graceStartedAt,
        overrides.deactivatedAt,
        overrides.lastPaymentFailureAt,
        overrides.lastPaymentSuccessAt,
        overrides.lastInvoiceId,
        overrides.stateVersion ?? 1,
        overrides.expirationPolicy,
    );
}

describe('ExpirationPolicyEngine', () => {
    let repo: InMemoryTenantRepository;
    let lifecycle: { evaluateTenantSubscriptionState: jest.Mock; hostSuspendTenant: jest.Mock; hostDeactivateTenant: jest.Mock; hostReactivateTenant: jest.Mock; };
    let tenantManager: { assignEditionToTenant: jest.Mock };
    let events: EventBus;
    let engine: ExpirationPolicyEngine;

    beforeEach(() => {
        repo = new InMemoryTenantRepository(new Map());
        lifecycle = {
            evaluateTenantSubscriptionState: jest.fn(async () => undefined),
            hostSuspendTenant: jest.fn(async (id: string) => { await repo.update(id, { subscriptionState: SubscriptionState.SUSPENDED, isSuspended: true }); }),
            hostDeactivateTenant: jest.fn(async (id: string) => { await repo.update(id, { subscriptionState: SubscriptionState.DEACTIVATED, deactivatedAt: new Date() }); }),
            hostReactivateTenant: jest.fn(async (id: string) => { await repo.update(id, { subscriptionState: SubscriptionState.ACTIVE, isSuspended: false }); }),
        } as any;
        tenantManager = {
            assignEditionToTenant: jest.fn(async (id: string, editionId: string | null) => { await repo.update(id, { editionId }); }),
        } as any;
        events = { publish: jest.fn() } as any;
        engine = new ExpirationPolicyEngine(repo as any, lifecycle as any, tenantManager as any, { get: jest.fn() } as any, events);
    });

    it('evaluates fallback to free when policy configured', async () => {
        const tenant = makeTenant({
            id: 'tenant-fallback',
            subscriptionState: SubscriptionState.PAST_DUE,
            subscriptionEndDate: new Date(Date.now() - 2 * MS_PER_DAY),
            expirationPolicy: { expirationAction: 'FALLBACK_TO_FREE', fallbackEditionId: 'free-edition', graceDays: 0, pastDueWindowDays: 0 },
        });
        await repo.create(tenant);

        const decision = await engine.evaluate(tenant.id, new Date());
        expect(decision.actionToApply).toBe('FALLBACK_TO_FREE');

        await engine.applyDecision(decision, 'spec');
        const updated = await repo.findById(tenant.id);
        expect(updated?.editionId).toBe('free-edition');
        expect(updated?.subscriptionState).toBe(SubscriptionState.ACTIVE);
        expect((events.publish as jest.Mock)).toHaveBeenCalled();
    });

    it('suspends when grace has ended and policy is suspend', async () => {
        const tenant = makeTenant({
            id: 'tenant-suspend',
            subscriptionState: SubscriptionState.GRACE,
            gracePeriodEndDate: new Date(Date.now() - MS_PER_DAY),
            expirationPolicy: { expirationAction: 'SUSPEND', graceDays: 0, pastDueWindowDays: 0 },
        });
        await repo.create(tenant);

        const decision = await engine.evaluate(tenant.id, new Date());
        expect(decision.actionToApply).toBe('SUSPEND');

        await engine.applyDecision(decision, 'spec');
        const updated = await repo.findById(tenant.id);
        expect(updated?.subscriptionState).toBe(SubscriptionState.SUSPENDED);
    });

    it('deactivates when policy is deactivate and window elapsed', async () => {
        const tenant = makeTenant({
            id: 'tenant-deactivate',
            subscriptionState: SubscriptionState.PAST_DUE,
            subscriptionEndDate: new Date(Date.now() - 5 * MS_PER_DAY),
            gracePeriodEndDate: new Date(Date.now() - MS_PER_DAY),
            expirationPolicy: { expirationAction: 'DEACTIVATE', graceDays: 0, pastDueWindowDays: 0 },
        });
        await repo.create(tenant);

        const decision = await engine.evaluate(tenant.id, new Date());
        expect(decision.actionToApply).toBe('DEACTIVATE');

        await engine.applyDecision(decision, 'spec');
        const updated = await repo.findById(tenant.id);
        expect(updated?.subscriptionState).toBe(SubscriptionState.DEACTIVATED);
    });
});
