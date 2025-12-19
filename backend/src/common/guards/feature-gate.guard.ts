import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EffectiveFeatureResolver } from '../../application/services/features/effective-feature-resolver.service';
import { TenantContext } from '../tenant/tenant.context';
import { FeatureCatalog } from '../../domain/features/feature-catalog';
import { FeatureValueParser } from '../../domain/features/feature-value-parser';
import { FeatureValueType } from '../../domain/features/feature-value-type';
import { FeatureDisabledException } from '../exceptions/feature-disabled.exception';
import { FEATURE_REQUIRE_ANY_KEY, FEATURE_REQUIREMENTS_KEY, FeatureRequirement } from '../decorators/requires-feature.decorator';
import { UnknownFeatureKeyException } from '../../domain/exceptions/unknown-feature-key.exception';

@Injectable()
export class FeatureGateGuard implements CanActivate {
    private readonly logger = new Logger(FeatureGateGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly features: EffectiveFeatureResolver,
        private readonly tenantContext: TenantContext,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirements = this.reflector.getAllAndMerge<FeatureRequirement[]>(FEATURE_REQUIREMENTS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || [];

        const anyRequirements = this.reflector.getAllAndMerge<FeatureRequirement[]>(FEATURE_REQUIRE_ANY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || [];

        if (requirements.length === 0 && anyRequirements.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const tenantId = this.resolveTenantId(request);
        if (!tenantId) {
            throw new ForbiddenException({ error: 'TENANT_CONTEXT_REQUIRED' });
        }

        if (anyRequirements.length > 0) {
            for (const req of anyRequirements) {
                const enabled = await this.evaluateRequirement(tenantId, req);
                if (enabled) {
                    return true;
                }
            }
            throw this.buildDisabled(reqFeatureKey(anyRequirements), tenantId, request, anyRequirements[0]?.message);
        }

        for (const req of requirements) {
            const enabled = await this.evaluateRequirement(tenantId, req);
            if (!enabled) {
                throw this.buildDisabled(req.key, tenantId, request, req.message);
            }
        }

        return true;
    }

    private async evaluateRequirement(tenantId: string, requirement: FeatureRequirement): Promise<boolean> {
        const mode = requirement.mode || 'BOOLEAN_TRUE';
        const key = requirement.key;

        try {
            const def = FeatureCatalog.get(key);
            const value = await this.features.getFeatureValue(tenantId, def.key);

            switch (mode) {
                case 'BOOLEAN_TRUE':
                    return FeatureValueParser.parseBoolean(value, def.key) === true;
                case 'EQUALS':
                    return value?.toString().toLowerCase() === (requirement.expectedValue ?? 'true').toLowerCase();
                case 'GTE': {
                    const targetRaw = requirement.expectedValue ?? '0';
                    const parsedValue = def.valueType === FeatureValueType.INT
                        ? FeatureValueParser.parseInt(value, def.key)
                        : FeatureValueParser.parseDecimal(value, def.key);
                    const parsedTarget = def.valueType === FeatureValueType.INT
                        ? FeatureValueParser.parseInt(targetRaw, def.key)
                        : FeatureValueParser.parseDecimal(targetRaw, def.key);
                    return parsedValue >= parsedTarget;
                }
                default:
                    return false;
            }
        } catch (error) {
            if (error instanceof UnknownFeatureKeyException) {
                this.logger.warn(`Unknown feature key referenced in gate: ${key}`);
                return false;
            }
            this.logger.error(`Feature gate evaluation failed for ${key}: ${error}`);
            return false;
        }
    }

    private resolveTenantId(request: any): string | null {
        try {
            if (this.tenantContext.hasTenantId()) {
                return this.tenantContext.tenantId;
            }
        } catch (err) {
            // ignore; fall back to request/user
        }

        const fromUser = request?.user?.tenantId;
        if (fromUser) {
            try {
                this.tenantContext.setTenantId(fromUser);
            } catch (err) {
                // ignore; context may already be set
            }
            return fromUser;
        }

        const headerTenant = request?.headers?.['x-tenant-id'];
        if (headerTenant) {
            return headerTenant;
        }

        return null;
    }

    private buildDisabled(featureKey: string, tenantId: string, request: any, message?: string): FeatureDisabledException {
        const payloadMessage = message || 'This feature is not enabled for your subscription plan.';
        const userId = request?.user?.userId || null;
        const method = request?.method;
        const path = request?.originalUrl || request?.url;
        this.logger.debug(`Feature gate blocked request ${JSON.stringify({ tenantId, userId, featureKey, method, path })}`);
        return new FeatureDisabledException(featureKey, payloadMessage);
    }
}

function reqFeatureKey(requirements: FeatureRequirement[]): string {
    return requirements.map((r) => r.key).join(' | ');
}
