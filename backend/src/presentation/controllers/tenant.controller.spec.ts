import { expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { Tenant } from '../../domain/tenant/entities/tenant.entity';
import { TenantStatus, TenantPlan } from '../../domain/tenant/entities/tenant.entity';
import { TenantContext } from '../../common/tenant/tenant.context';
import { TenantResponseDto } from '../dtos/responses/tenant/tenant-response.dto';
import { CreateTenantUseCase, GetTenantBySubdomainUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase } from '../../application/services/tenant';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantResolutionService } from '../../common/tenant/tenant-resolution.service';

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
        plan: TenantPlan.TRIAL,
        status: TenantStatus.PENDING,
        metadata: { schoolId: 'SCH-ABC123' },
    });
    (tenant as any).id = 'tenant-1';
    return tenant;
};

describe('TenantController', () => {
    let controller: TenantController;
    const createTenantUseCase = { execute: jest.fn() };
    const getTenantBySubdomainUseCase = { execute: jest.fn() };
    const getTenantSettingsUseCase = { execute: jest.fn() };
    const updateTenantSettingsUseCase = { execute: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TenantController],
            providers: [
                { provide: CreateTenantUseCase, useValue: createTenantUseCase },
                { provide: GetTenantBySubdomainUseCase, useValue: getTenantBySubdomainUseCase },
                { provide: GetTenantSettingsUseCase, useValue: getTenantSettingsUseCase },
                { provide: UpdateTenantSettingsUseCase, useValue: updateTenantSettingsUseCase },
                { provide: TenantContext, useValue: { tenantId: 'tenant-ctx', setTenantId: jest.fn(), hasTenantId: () => true } },
                { provide: TenantGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
                { provide: TenantResolutionService, useValue: { resolve: jest.fn() } },
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
});
