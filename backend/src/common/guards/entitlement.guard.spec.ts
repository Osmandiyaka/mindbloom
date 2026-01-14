import { Reflector } from '@nestjs/core';
import { EntitlementGuard } from './entitlement.guard';
import { REQUIRED_MODULE_KEY, REQUIRED_FEATURE_KEY } from '../decorators/require-entitlement.decorator';

const createExecutionContext = (handler: any, user: any) => ({
    getHandler: () => handler,
    getClass: () => ({}),
    switchToHttp: () => ({
        getRequest: () => ({ user, headers: {} }),
    }),
} as any);

describe('EntitlementGuard', () => {
    it('allows when entitlement is enabled', async () => {
        const handler = () => null;
        Reflect.defineMetadata(REQUIRED_MODULE_KEY, 'roles', handler);

        const entitlementsService = {
            getEntitlementsForTenant: jest.fn().mockResolvedValue({
                requiresEditionSelection: false,
                modules: { roles: true },
                features: {},
            }),
        } as any;

        const guard = new EntitlementGuard(new Reflector(), entitlementsService);
        const context = createExecutionContext(handler, { tenantId: 't-1' });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('blocks when entitlement is disabled', async () => {
        const handler = () => null;
        Reflect.defineMetadata(REQUIRED_MODULE_KEY, 'roles', handler);

        const entitlementsService = {
            getEntitlementsForTenant: jest.fn().mockResolvedValue({
                requiresEditionSelection: false,
                modules: { roles: false },
                features: {},
            }),
        } as any;

        const guard = new EntitlementGuard(new Reflector(), entitlementsService);
        const context = createExecutionContext(handler, { tenantId: 't-1' });

        try {
            await guard.canActivate(context);
            fail('Expected MODULE_NOT_ENABLED');
        } catch (error) {
            expect(error).toBeTruthy();
            expect((error as Error).message).toBe('MODULE_NOT_ENABLED');
        }
    });

    it('blocks when feature entitlement is disabled', async () => {
        const handler = () => null;
        Reflect.defineMetadata(REQUIRED_FEATURE_KEY, 'security.auditLogs', handler);

        const entitlementsService = {
            getEntitlementsForTenant: jest.fn().mockResolvedValue({
                requiresEditionSelection: false,
                modules: {},
                features: { 'security.auditLogs': false },
            }),
        } as any;

        const guard = new EntitlementGuard(new Reflector(), entitlementsService);
        const context = createExecutionContext(handler, { tenantId: 't-1' });

        try {
            await guard.canActivate(context);
            fail('Expected FEATURE_NOT_ENABLED');
        } catch (error) {
            expect(error).toBeTruthy();
            expect((error as Error).message).toBe('FEATURE_NOT_ENABLED');
        }
    });
});
