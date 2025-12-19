import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { HostEditionsController } from './host-editions.controller';
import { HostTenantSubscriptionsController } from './host-tenant-subscriptions.controller';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';
import { TenantManager } from '../../application/services/tenant/tenant-manager.service';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { PermissionAction } from '../../domain/rbac/entities/permission.entity';
import { AssignBehavior, ProrationPolicy } from '../../domain/tenant/entities/tenant-subscription.types';

const createExecutionContext = (handler: any, controllerClass: any, user: any, headers: Record<string, any> = {}) => ({
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
        getRequest: () => ({ user, headers }),
    }),
} as any);

describe('Host security guardrails', () => {
    let hostGuard: HostContextGuard;
    let permissionGuard: PermissionGuard;
    let userRepository: { findById: jest.Mock };
    let editionsController: HostEditionsController;
    let tenantController: HostTenantSubscriptionsController;

    beforeEach(async () => {
        userRepository = { findById: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HostEditionsController, HostTenantSubscriptionsController],
            providers: [
                HostContextGuard,
                PermissionGuard,
                Reflector,
                { provide: EditionManager, useValue: { listEditions: jest.fn(), getEditionWithFeatures: jest.fn(), createEdition: jest.fn(), updateEdition: jest.fn(), setEditionFeatures: jest.fn() } },
                { provide: TenantManager, useValue: { assignEditionToTenant: jest.fn(), extendSubscription: jest.fn(), changeEdition: jest.fn(), suspendTenant: jest.fn(), reactivateTenant: jest.fn() } },
                { provide: TenantContext, useValue: { hasTenantId: () => false, get tenantId() { throw new Error('no tenant'); } } },
                { provide: USER_REPOSITORY, useValue: userRepository },
            ],
        }).compile();

        hostGuard = module.get(HostContextGuard);
        permissionGuard = module.get(PermissionGuard);
        editionsController = module.get(HostEditionsController);
        tenantController = module.get(HostTenantSubscriptionsController);
    });

    it('blocks tenant-context users from host editions list', async () => {
        const context = createExecutionContext(editionsController.list, HostEditionsController, { userId: 'u1', roleName: 'Tenant Admin', tenantId: 't1' });
        expect(() => hostGuard.canActivate(context as any)).toThrow(new ForbiddenException('HOST_CONTEXT_REQUIRED'));
    });

    it('allows host admin with view permission to list editions', async () => {
        const context = createExecutionContext(editionsController.list, HostEditionsController, { userId: 'u-host', roleName: 'Host Admin', tenantId: null });
        userRepository.findById.mockResolvedValue({ role: { name: 'Host Admin', permissions: [{ id: 'Host.Editions.View', resource: 'Host.Editions.View', actions: [PermissionAction.READ] }] } });

        expect(await hostGuard.canActivate(context as any)).toBe(true);
        expect(await permissionGuard.canActivate(context as any)).toBe(true);
    });

    it('blocks host users lacking manage permission on edition update', async () => {
        const context = createExecutionContext(editionsController.update, HostEditionsController, { userId: 'u-host', roleName: 'Host Operator', tenantId: null });
        userRepository.findById.mockResolvedValue({ role: { name: 'Host Operator', permissions: [] } });

        expect(await hostGuard.canActivate(context as any)).toBe(true);
        try {
            await permissionGuard.canActivate(context as any);
            fail('Expected forbidden');
        } catch (err) {
            expect(err).toBeInstanceOf(ForbiddenException);
            expect((err as any).message).toBe('INSUFFICIENT_PERMISSIONS');
        }
    });

    it('enforces assign-edition permission for tenant subscription actions', async () => {
        const context = createExecutionContext(tenantController.assignEdition, HostTenantSubscriptionsController, { userId: 'u-host', roleName: 'Host Operator', tenantId: null });
        userRepository.findById.mockResolvedValue({
            role: { name: 'Host Operator', permissions: [{ id: 'Host.Tenants.AssignEdition', resource: 'Host.Tenants.AssignEdition', actions: [PermissionAction.MANAGE] }] },
        });

        expect(await hostGuard.canActivate(context as any)).toBe(true);
        expect(await permissionGuard.canActivate(context as any)).toBe(true);

        await tenantController.assignEdition('tenant-1', { editionId: 'edition-1', subscriptionEndDate: null, behavior: AssignBehavior.IMMEDIATE } as any);
        expect((tenantController as any).tenantManager.assignEditionToTenant).toHaveBeenCalledWith('tenant-1', 'edition-1', null, AssignBehavior.IMMEDIATE);
    });

    it('requires subscription manage permission for change-edition flow', async () => {
        const context = createExecutionContext(tenantController.changeEdition, HostTenantSubscriptionsController, { userId: 'u-host', roleName: 'Host Operator', tenantId: null });
        userRepository.findById.mockResolvedValue({
            role: { name: 'Host Operator', permissions: [{ id: 'Host.Subscriptions.Manage', resource: 'Host.Subscriptions.Manage', actions: [PermissionAction.MANAGE] }] },
        });

        expect(await hostGuard.canActivate(context as any)).toBe(true);
        expect(await permissionGuard.canActivate(context as any)).toBe(true);

        await tenantController.changeEdition('tenant-1', { editionId: 'edition-2', effectiveDate: new Date().toISOString(), prorationPolicy: ProrationPolicy.IMMEDIATE_PRORATE } as any);
        expect((tenantController as any).tenantManager.changeEdition).toHaveBeenCalled();
    });
});
