import { Test, TestingModule } from '@nestjs/testing';
import { HostTenantSubscriptionsController } from './host-tenant-subscriptions.controller';
import { TenantManager } from '../../application/services/tenant/tenant-manager.service';
import { GetTenantByIdUseCase } from '../../application/services/tenant';
import { AuditService } from '../../application/services/audit/audit.service';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantContext } from '../../common/tenant/tenant.context';

describe('HostTenantSubscriptionsController', () => {
    let controller: HostTenantSubscriptionsController;
    const tenantManager = { assignEditionToTenant: jest.fn(), extendSubscription: jest.fn(), changeEdition: jest.fn(), suspendTenant: jest.fn(), reactivateTenant: jest.fn() } as any;

    const mockUserRepo = { findAll: jest.fn() } as any;
    const mockGetTenant = { execute: jest.fn() } as any;
    const mockAudit = { query: jest.fn() } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HostTenantSubscriptionsController],
            providers: [
                HostContextGuard,
                PermissionGuard,
                { provide: TenantContext, useValue: { hasTenantId: () => false, tenantId: null } },
                { provide: TenantManager, useValue: tenantManager },
                { provide: GetTenantByIdUseCase, useValue: mockGetTenant },
                { provide: AuditService, useValue: mockAudit },
                { provide: USER_REPOSITORY, useValue: mockUserRepo },
            ],
        }).compile();

        controller = module.get<HostTenantSubscriptionsController>(HostTenantSubscriptionsController);
    });

    afterEach(() => jest.resetAllMocks());

    it('should return tenant users', async () => {
        const users = [{ id: 'u1', email: 'a@b.com', name: 'Test', roleId: null, role: null, permissions: [], profilePicture: null, createdAt: new Date() }];
        mockUserRepo.findAll.mockResolvedValue(users);

        const res = await controller.getTenantUsers('t-1');
        expect(mockUserRepo.findAll).toHaveBeenCalledWith('t-1');
        expect(res[0].id).toBe('u1');
    });

    it('should return tenant invoices from tenant billing', async () => {
        const tenant = {
            id: 't-1',
            billing: { invoices: [{ id: 'inv1', date: new Date('2025-01-01'), amount: 123.45, status: 'ISSUED' }] }
        } as any;
        mockGetTenant.execute.mockResolvedValue(tenant);

        const res = await controller.getTenantInvoices('t-1');
        expect(mockGetTenant.execute).toHaveBeenCalledWith('t-1');
        expect(res.length).toBe(1);
        expect(res[0].id).toBe('inv1');
    });

    it('should return tenant issues from audit', async () => {
        const auditRes = { items: [{ id: 'a1', message: 'Issue reported', timestamp: new Date(), actorEmailSnapshot: 'u@e' }], total: 1, page: 1, pageSize: 20 };
        mockAudit.query.mockResolvedValue(auditRes);

        const res = await controller.getTenantIssues('t-1');
        expect(mockAudit.query).toHaveBeenCalledWith({ tenantId: 't-1', page: 1, pageSize: 20, category: 'ISSUE' });
        expect(res.length).toBe(1);
        expect(res[0].message).toContain('Issue');
    });
});
