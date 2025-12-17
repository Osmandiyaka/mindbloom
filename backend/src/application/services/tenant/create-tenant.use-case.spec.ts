import { ConflictException } from '@nestjs/common';
import { expect } from '@jest/globals';
import { randomUUID } from 'crypto';
import { Tenant, TenantPlan, TenantStatus, WeekStart } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';
import { CreateTenantUseCase } from './create-tenant.use-case';
import { InitializeSystemRolesUseCase } from '../rbac/initialize-system-roles.use-case';
import { CreateUserUseCase } from '../user';

class InMemoryTenantRepository implements ITenantRepository {
    private store: Map<string, Tenant> = new Map();

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

    async create(tenant: Tenant): Promise<Tenant> {
        const id = randomUUID();
        const created = { ...tenant, id } as Tenant;
        this.store.set(id, created);
        return created;
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

describe('CreateTenantUseCase', () => {
    let repo: InMemoryTenantRepository;
    let roles: InitializeSystemRolesUseCase;
    let users: CreateUserUseCase;
    let tenantPlanMailer: { sendPlanAssignment: jest.Mock };
    let useCase: CreateTenantUseCase;

    beforeEach(() => {
        repo = new InMemoryTenantRepository();
        roles = {
            execute: jest.fn().mockResolvedValue([
                { id: 'role-admin', name: SYSTEM_ROLE_NAMES.TENANT_ADMIN },
            ]),
        } as any;
        users = {
            execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
        } as any;
        tenantPlanMailer = { sendPlanAssignment: jest.fn().mockResolvedValue(undefined) } as any;
        useCase = new CreateTenantUseCase(repo, roles, users, tenantPlanMailer as any);
    });

    it('creates a tenant with generated subdomain, schoolId, contact info, and admin account', async () => {
        const tenant = await useCase.execute({
            name: 'Greenfield High School',
            contactEmail: 'admin@greenfield.edu',
            adminName: 'Jane Admin',
            adminEmail: 'admin@greenfield.edu',
            contactPhone: '+1-202-555-0123',
            address: { city: 'Springfield', country: 'USA' },
            branding: {
                logo: 'https://cdn/logo.png',
                customDomain: 'greenfield.example.edu',
            },
            locale: 'en-GB',
            timezone: 'Europe/London',
            weekStartsOn: 'monday',
            academicYear: { start: '2025-09-01', end: '2026-07-31', name: 'AY 2025-2026' },
        });

        expect(tenant.subdomain).toBe('greenfield-high-school');
        expect(tenant.metadata?.schoolId).toMatch(/SCH-/);
        expect(tenant.contactInfo.phone).toBe('+1-202-555-0123');
        expect(tenant.contactInfo.address?.city).toBe('Springfield');
        expect(tenant.customization?.logo).toBe('https://cdn/logo.png');
        expect(tenant.customization?.customDomain).toBe('greenfield.example.edu');
        expect(tenant.locale).toBe('en-GB');
        expect(tenant.timezone).toBe('Europe/London');
        expect(tenant.weekStartsOn).toBe(WeekStart.MONDAY);
        expect(tenant.academicYear?.name).toBe('AY 2025-2026');
        expect(users.execute).toHaveBeenCalledWith(expect.objectContaining({
            tenantId: tenant.id,
            email: 'admin@greenfield.edu',
            name: 'Jane Admin',
            forcePasswordReset: true,
        }));
    });

    it('appends suffix when subdomain already exists', async () => {
        await useCase.execute({
            name: 'Greenfield',
            subdomain: 'greenfield',
            contactEmail: 'first@school.com',
            adminName: 'First',
            adminEmail: 'first@school.com',
            branding: { customDomain: 'school.mindbloom.app' },
        });

        const second = await useCase.execute({
            name: 'Greenfield',
            subdomain: 'greenfield',
            contactEmail: 'second@school.com',
            adminName: 'Second',
            adminEmail: 'second@school.com',
            branding: { customDomain: 'second.mindbloom.app' },
        });

        expect(second.subdomain).toBe('greenfield-1');
        expect(second.metadata?.schoolId).toMatch(/SCH-/);
    });

    it('rolls back tenant when user creation fails', async () => {
        (users.execute as jest.Mock).mockRejectedValueOnce(new Error('user-fail'));

        await expect(useCase.execute({
            name: 'Rollback School',
            contactEmail: 'r@school.com',
            adminName: 'R',
            adminEmail: 'r@school.com',
        })).rejects.toThrow('user-fail');

        expect(await repo.findAll()).toHaveLength(0);
    });

    it('throws when too many collisions occur', async () => {
        jest.spyOn(repo, 'findBySubdomain').mockResolvedValue(true as any);
        useCase = new CreateTenantUseCase(repo, roles, users, tenantPlanMailer as any);

        await expect(useCase.execute({
            name: 'Repeat',
            contactEmail: 'x@x.com',
            adminName: 'Admin',
            adminEmail: 'x@x.com',
        })).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects duplicate custom domain', async () => {
        await useCase.execute({
            name: 'Domain One',
            contactEmail: 'one@school.com',
            adminName: 'One',
            adminEmail: 'one@school.com',
            branding: { customDomain: 'alias.school.com' },
        });

        await expect(useCase.execute({
            name: 'Domain Two',
            contactEmail: 'two@school.com',
            adminName: 'Two',
            adminEmail: 'two@school.com',
            branding: { customDomain: 'alias.school.com' },
        })).rejects.toBeInstanceOf(ConflictException);
    });
});
