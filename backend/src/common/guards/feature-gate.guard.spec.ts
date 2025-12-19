import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGateGuard } from './feature-gate.guard';
import { FEATURE_REQUIREMENTS_KEY } from '../decorators/requires-feature.decorator';
import { FeatureDisabledException } from '../exceptions/feature-disabled.exception';

const createContext = (handler: any, controller: any, request: any) => ({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
}) as any;

describe('FeatureGateGuard', () => {
    let reflector: Reflector;
    let features: { getFeatureValue: jest.Mock };
    let tenantContext: { hasTenantId: jest.Mock; tenantId: string; setTenantId: jest.Mock };
    let guard: FeatureGateGuard;

    beforeEach(() => {
        reflector = new Reflector();
        features = { getFeatureValue: jest.fn() } as any;
        tenantContext = { hasTenantId: jest.fn(() => true), tenantId: 't-1', setTenantId: jest.fn() } as any;
        guard = new FeatureGateGuard(reflector, features as any, tenantContext as any);
    });

    it('allows request when feature is enabled', async () => {
        const handler = () => null;
        Reflect.defineMetadata(FEATURE_REQUIREMENTS_KEY, [{ key: 'modules.attendance.enabled' }], handler);
        features.getFeatureValue.mockResolvedValue('true');

        const context = createContext(handler, class TestController { }, { method: 'GET', url: '/path', user: { userId: 'u1' } });

        const result = await guard.canActivate(context as any);
        expect(result).toBe(true);
        expect(features.getFeatureValue).toHaveBeenCalledWith('t-1', 'modules.attendance.enabled');
    });

    it('blocks request when feature is disabled', async () => {
        const handler = () => null;
        Reflect.defineMetadata(FEATURE_REQUIREMENTS_KEY, [{ key: 'modules.fees.enabled' }], handler);
        features.getFeatureValue.mockResolvedValue('false');

        const context = createContext(handler, class TestController { }, { method: 'GET', url: '/path', user: { userId: 'u1' } });

        let thrown = false;
        try {
            await guard.canActivate(context as any);
        } catch (error) {
            thrown = true;
            expect(error).toBeInstanceOf(FeatureDisabledException);
        }
        expect(thrown).toBe(true);
    });

    it('denies when tenant context missing', async () => {
        tenantContext.hasTenantId.mockReturnValue(false);
        const handler = () => null;
        Reflect.defineMetadata(FEATURE_REQUIREMENTS_KEY, [{ key: 'modules.attendance.enabled' }], handler);
        features.getFeatureValue.mockResolvedValue('true');

        const context = createContext(handler, class TestController { }, { method: 'GET', url: '/path', user: {} });

        let thrown = false;
        try {
            await guard.canActivate(context as any);
        } catch (error) {
            thrown = true;
            expect(error).toBeInstanceOf(ForbiddenException);
        }
        expect(thrown).toBe(true);
    });
});
