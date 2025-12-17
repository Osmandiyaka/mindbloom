import { UnauthorizedException } from '@nestjs/common';
import { expect } from '@jest/globals';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../domain/ports/out/tenant-repository.port';
import { TenantContext } from './tenant.context';
import { TenantResolutionService } from './tenant-resolution.service';

class FakeTenantRepository implements ITenantRepository {
    constructor(private readonly tenants: Array<{ id: string; subdomain: string; customDomain?: string }>) { }

    async findAll() { return []; }
    async findById() { return null; }
    async create(): Promise<any> { throw new Error('not implemented'); }
    async update(): Promise<any> { throw new Error('not implemented'); }
    async delete(): Promise<void> { return; }

    async findWithFilters(query: TenantListQuery): Promise<TenantListResult> {
        return { data: [], total: 0, page: query.page || 1, pageSize: query.pageSize || 0 };
    }

    async findByCustomDomain(customDomain: string) {
        const match = this.tenants.find((t) => t.customDomain === customDomain);
        return match ? ({ id: match.id } as any) : null;
    }

    async findBySubdomain(subdomain: string) {
        const match = this.tenants.find((t) => t.subdomain === subdomain);
        return match ? ({ id: match.id } as any) : null;
    }
}

describe('TenantResolutionService', () => {
    it('prefers custom domain over subdomain lookup', async () => {
        const repo = new FakeTenantRepository([
            { id: 't1', subdomain: 'alpha', customDomain: 'alias.school.com' },
            { id: 't2', subdomain: 'alias' },
        ]);
        const context = new TenantContext();
        const service = new TenantResolutionService(repo as any, context);

        const id = await service.resolve({ headers: { host: 'alias.school.com' } });

        expect(id).toBe('t1');
        expect(context.tenantId).toBe('t1');
    });

    it('falls back to subdomain when no custom domain match', async () => {
        const repo = new FakeTenantRepository([{ id: 't3', subdomain: 'beta' }]);
        const context = new TenantContext();
        const service = new TenantResolutionService(repo as any, context);

        const id = await service.resolve({ headers: { host: 'beta.mindbloom.app' } });

        expect(id).toBe('t3');
        expect(context.tenantId).toBe('t3');
    });

    it('throws when unable to resolve tenant', async () => {
        const repo = new FakeTenantRepository([]);
        const context = new TenantContext();
        const service = new TenantResolutionService(repo as any, context);

        await expect(service.resolve({ headers: { host: 'unknown.app' } })).rejects.toBeInstanceOf(UnauthorizedException);
    });
});
