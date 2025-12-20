import { ConflictException, NotFoundException } from '@nestjs/common';
import { expect } from '@jest/globals';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TenantListQuery, TenantListResult } from '../../../domain/ports/out/tenant-repository.port';
import { UpdateTenantSettingsUseCase } from './update-tenant-settings.use-case';
import { UpdateTenantSettingsCommand } from '../../ports/in/commands/update-tenant-settings.command';

class FakeTenantRepository implements ITenantRepository {
    constructor(private readonly store: Map<string, Tenant>) { }

    async findAll(): Promise<Tenant[]> {
        return Array.from(this.store.values());
    }

    async findById(id: string): Promise<Tenant | null> {
        return this.store.get(id) || null;
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        return Array.from(this.store.values()).find((t) => t.subdomain === subdomain) || null;
    }

    async findByCustomDomain(customDomain: string): Promise<Tenant | null> {
        return Array.from(this.store.values()).find((t) => t.customization?.customDomain === customDomain) || null;
    }

    async findWithFilters(query: TenantListQuery): Promise<TenantListResult> {
        const data = Array.from(this.store.values());
        const page = query.page || 1;
        const pageSize = query.pageSize || data.length || 1;
        return { data, total: data.length, page, pageSize };
    }

    async create(): Promise<Tenant> {
        throw new Error('not implemented');
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        const existing = this.store.get(id);
        if (!existing) {
            throw new Error('Tenant not found');
        }
        const updated = { ...existing, ...data } as Tenant;
        this.store.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }
}

function buildTenant(id: string, name: string, customization?: any): Tenant {
    const tenant = Tenant.create({
        name,
        subdomain: name.toLowerCase(),
        contactEmail: `${name}@school.com`,
        metadata: { editionCode: 'basic' },
        customization,
    });
    (tenant as any).id = id;
    return tenant as Tenant;
}

describe('UpdateTenantSettingsUseCase', () => {
    let repo: FakeTenantRepository;
    let useCase: UpdateTenantSettingsUseCase;

    beforeEach(() => {
        const tenants = new Map<string, Tenant>();
        tenants.set('t1', buildTenant('t1', 'One', { customDomain: 'one.school.com', primaryColor: '#111111' }));
        tenants.set('t2', buildTenant('t2', 'Two', { customDomain: 'taken.school.com' }));
        repo = new FakeTenantRepository(tenants);
        useCase = new UpdateTenantSettingsUseCase(repo as any);
    });

    it('throws when tenant not found', async () => {
        const command = new UpdateTenantSettingsCommand('missing', { customization: { customDomain: 'new.domain' } });
        await expect(useCase.execute(command)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects duplicate custom domain from another tenant', async () => {
        const command = new UpdateTenantSettingsCommand('t1', { customization: { customDomain: 'taken.school.com' } });
        await expect(useCase.execute(command)).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates customization when domain is available', async () => {
        const command = new UpdateTenantSettingsCommand('t1', {
            customization: {
                customDomain: 'fresh.school.com',
                secondaryColor: '#222222',
            },
        });

        const updated = await useCase.execute(command);

        expect(updated.customization?.customDomain).toBe('fresh.school.com');
        expect(updated.customization?.primaryColor).toBe('#111111');
        expect(updated.customization?.secondaryColor).toBe('#222222');
    });
});
