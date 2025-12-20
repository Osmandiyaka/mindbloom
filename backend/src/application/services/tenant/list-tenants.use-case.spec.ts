import { expect } from '@jest/globals';
import { Tenant, TenantPlan, TenantStatus } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../../domain/ports/out/tenant-repository.port';
import { ListTenantsUseCase } from './list-tenants.use-case';

class InMemoryTenantRepository implements ITenantRepository {
    constructor(private tenants: Tenant[]) { }

    async findAll(): Promise<Tenant[]> { return this.tenants; }
    async findById(): Promise<Tenant | null> { return null; }
    async findBySubdomain(): Promise<Tenant | null> { return null; }
    async findByCustomDomain(): Promise<Tenant | null> { return null; }
    async create(): Promise<Tenant> { throw new Error('not implemented'); }
    async update(): Promise<Tenant> { throw new Error('not implemented'); }
    async delete(): Promise<void> { return; }

    async findWithFilters(query: TenantListQuery): Promise<TenantListResult> {
        let filtered = [...this.tenants];

        if (query.statuses && query.statuses.length > 0) {
            filtered = filtered.filter((t) => query.statuses?.includes(t.status));
        }

        if (query.editions && query.editions.length > 0) {
            filtered = filtered.filter((t) => (query.editions || []).includes(t.metadata?.editionCode ?? t.plan));
        }

        if (query.trialExpiringBefore) {
            filtered = filtered.filter((t) => t.trialEndsAt && t.trialEndsAt <= query.trialExpiringBefore);
        }

        if (query.search && query.search.trim()) {
            const term = query.search.toLowerCase();
            filtered = filtered.filter((t) =>
                t.name.toLowerCase().includes(term) ||
                t.subdomain.toLowerCase().includes(term) ||
                t.contactInfo.email.toLowerCase().includes(term) ||
                (t.customization?.customDomain || '').toLowerCase().includes(term),
            );
        }

        const page = query.page || 1;
        const pageSize = query.pageSize || filtered.length || 1;
        const start = (page - 1) * pageSize;
        const pageData = filtered.slice(start, start + pageSize);

        return {
            data: pageData,
            total: filtered.length,
            page,
            pageSize,
        };
    }
}

function buildTenant(props: Partial<Tenant> & { name: string; subdomain: string; status: TenantStatus; plan: TenantPlan; email?: string; usage?: any; trialEndsAt?: Date; customDomain?: string }): Tenant {
    const tenant = Tenant.create({
        name: props.name,
        subdomain: props.subdomain,
        contactEmail: props.email || `${props.subdomain}@school.com`,
        plan: props.plan,
        status: props.status,
        customization: props.customDomain ? { customDomain: props.customDomain } : undefined,
    });
    (tenant as any).id = `${props.subdomain}-id`;
    (tenant as any).usage = props.usage || tenant.usage;
    (tenant as any).trialEndsAt = props.trialEndsAt;
    return tenant;
}

describe('ListTenantsUseCase', () => {
    const now = new Date();
    const tenants = [
        buildTenant({ name: 'Alpha School', subdomain: 'alpha', status: TenantStatus.ACTIVE, plan: TenantPlan.PREMIUM, usage: { currentStudents: 200, currentTeachers: 20, currentClasses: 10, currentAdmins: 2, currentStorage: 1024, currentBandwidth: 0 } }),
        buildTenant({ name: 'Beta Academy', subdomain: 'beta', status: TenantStatus.SUSPENDED, plan: TenantPlan.BASIC, usage: { currentStudents: 50, currentTeachers: 5, currentClasses: 3, currentAdmins: 1, currentStorage: 256, currentBandwidth: 0 } }),
        buildTenant({ name: 'Gamma Institute', subdomain: 'gamma', status: TenantStatus.ACTIVE, plan: TenantPlan.TRIAL, trialEndsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), customDomain: 'gamma.school.com', usage: { currentStudents: 30, currentTeachers: 3, currentClasses: 2, currentAdmins: 1, currentStorage: 128, currentBandwidth: 0 } }),
    ];

    it('filters, paginates, and returns aggregates', async () => {
        const repo = new InMemoryTenantRepository(tenants);
        const useCase = new ListTenantsUseCase(repo as any);

        const result = await useCase.execute({
            search: 'alpha',
            statuses: [TenantStatus.ACTIVE],
            page: 1,
            pageSize: 2,
        });

        expect(result.total).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Alpha School');
        expect(result.aggregates.active).toBe(1);
        expect(result.aggregates.suspended).toBe(0);
        expect(result.aggregates.trial).toBe(0);
        expect(result.aggregates.usageTotals.students).toBe(200);
    });

    it('counts trials expiring within default window', async () => {
        const repo = new InMemoryTenantRepository(tenants);
        const useCase = new ListTenantsUseCase(repo as any);

        const result = await useCase.execute({ editions: ['trial'] });

        expect(result.aggregates.trial).toBe(1);
        expect(result.aggregates.trialExpiring).toBe(1);
    });
});
