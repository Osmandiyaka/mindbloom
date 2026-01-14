import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementsService } from '../../application/services/entitlements/entitlements.service';
import { REQUIRED_FEATURE_KEY, REQUIRED_MODULE_KEY } from '../decorators/require-entitlement.decorator';
import { FeatureKey, ModuleKey } from '../../domain/entitlements/entitlements.keys';

@Injectable()
export class EntitlementGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly entitlements: EntitlementsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const moduleKey = this.reflector.getAllAndOverride<ModuleKey | undefined>(
            REQUIRED_MODULE_KEY,
            [context.getHandler(), context.getClass()],
        );
        const featureKey = this.reflector.getAllAndOverride<FeatureKey | undefined>(
            REQUIRED_FEATURE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!moduleKey && !featureKey) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const tenantId = request.user?.tenantId ?? request.headers?.['x-tenant-id'];
        if (!tenantId) {
            throw new ForbiddenException('TENANT_CONTEXT_REQUIRED');
        }

        const entitlements = await this.entitlements.getEntitlementsForTenant(tenantId);
        if (entitlements.requiresEditionSelection) {
            throw new ForbiddenException('EDITION_REQUIRED');
        }

        if (moduleKey && !entitlements.modules[moduleKey]) {
            throw new ForbiddenException('MODULE_NOT_ENABLED');
        }
        if (featureKey && !entitlements.features[featureKey]) {
            throw new ForbiddenException('FEATURE_NOT_ENABLED');
        }

        return true;
    }
}
