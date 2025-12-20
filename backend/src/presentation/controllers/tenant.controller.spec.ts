import { expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { Tenant } from '../../domain/tenant/entities/tenant.entity';
import { TenantStatus } from '../../domain/tenant/entities/tenant.entity';
import { TenantContext } from '../../common/tenant/tenant.context';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';
import { TenantResponseDto } from '../dtos/responses/tenant/tenant-response.dto';
import { CreateTenantUseCase, GetTenantBySubdomainUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase, ListTenantsUseCase, GetTenantByIdUseCase } from '../../application/services/tenant';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantResolutionService } from '../../common/tenant/tenant-resolution.service';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';

const buildTenant = (): Tenant => {
    const tenant = Tenant.create({
        name: 'Greenfield High School',
        subdomain: 'greenfield',
        contactEmail: 'admin@greenfield.edu',
        contactPhone: '+1-202-555-0123',
        address: { city: 'Springfield', country: 'USA' },
        logo: 'https://cdn/logo.png',
        locale: 'en-GB',
        timezone: 'Europe/London',
        weekStartsOn: 'monday' as any,
        metadata: { editionCode: 'trial', schoolId: 'SCH-ABC123' },
        status: TenantStatus.PENDING,
    });
    (tenant as any).id = 'tenant-1';
    return tenant;
};

describe('TenantController', () => {
    let controller: TenantController;
    const createTenantUseCase = { execute: jest.fn() };
    const getTenantBySubdomainUseCase = { execute: jest.fn() };
    const getTenantByIdUseCase = { execute: jest.fn() };
    const getTenantSettingsUseCase = { execute: jest.fn() };
    const updateTenantSettingsUseCase = { execute: jest.fn() };
    const listTenantsUseCase = { execute: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TenantController],
            providers: [
                { provide: CreateTenantUseCase, useValue: createTenantUseCase },
                { provide: GetTenantBySubdomainUseCase, useValue: getTenantBySubdomainUseCase },
                { provide: GetTenantByIdUseCase, useValue: getTenantByIdUseCase },
                { provide: GetTenantSettingsUseCase, useValue: getTenantSettingsUseCase },
                { provide: UpdateTenantSettingsUseCase, useValue: updateTenantSettingsUseCase },
                { provide: ListTenantsUseCase, useValue: listTenantsUseCase },
                { provide: TenantContext, useValue: { tenantId: 'tenant-ctx', setTenantId: jest.fn(), hasTenantId: () => true } },
                { provide: EditionManager, useValue: { listEditions: jest.fn(), getEditionWithFeatures: jest.fn() } },
                { provide: TenantGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
                { provide: TenantResolutionService, useValue: { resolve: jest.fn() } },
                { provide: PermissionGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
                { provide: USER_REPOSITORY, useValue: { findById: jest.fn() } },
            ],
        }).compile();

        controller = module.get<TenantController>(TenantController);
        jest.resetAllMocks();
    });

    it('maps create tenant request to response dto', async () => {
        const tenant = buildTenant();
        (createTenantUseCase.execute as jest.Mock).mockResolvedValue(tenant);

        const result = await controller.createTenant({
            name: 'Greenfield High School',
            contactEmail: 'admin@greenfield.edu',
            adminName: 'Jane Doe',
            adminEmail: 'admin@greenfield.edu',
            locale: 'en-GB',
            timezone: 'Europe/London',
            weekStartsOn: 'monday',
            academicYear: { start: '2025-09-01', end: '2026-07-31', name: 'AY 25/26' },
        } as any);

        expect(createTenantUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Greenfield High School',
            contactEmail: 'admin@greenfield.edu',
        }));
        expect(result).toEqual(TenantResponseDto.fromDomain(tenant));
    });

    it('lists tenants with aggregates', async () => {
        const tenant = buildTenant();
        (listTenantsUseCase.execute as jest.Mock).mockResolvedValue({
            data: [tenant],
            total: 1,
            page: 1,
            pageSize: 20,
            aggregates: {
                total: 1,
                active: 0,
                suspended: 0,
                trial: 1,
                trialExpiring: 0,
                usageTotals: { students: 0, teachers: 0, classes: 0, storageMb: 0 },
            },
        });

        const result = await controller.listTenants({ page: 1, pageSize: 20 } as any);

        expect(listTenantsUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }));
        expect(result.total).toBe(1);
        expect(result.data[0].id).toBe('tenant-1');
        expect(result.aggregates.total).toBe(1);
    });
});
