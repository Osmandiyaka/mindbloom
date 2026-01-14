import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import {
    FEATURE_KEYS,
    MODULE_KEYS,
    type FeatureKey,
    type ModuleKey,
} from '../../../domain/entitlements/entitlements.keys';
import { getCanonicalEditionByCode } from '../../../domain/entitlements/entitlements.registry';

export interface EffectiveEntitlements {
    tenantId: string;
    edition: {
        code: string;
        displayName: string;
        description?: string | null;
        version: number;
    } | null;
    modules: Record<ModuleKey, boolean>;
    features: Record<FeatureKey, boolean>;
    limits?: {
        maxSchools?: number | null;
        maxUsers?: number | null;
        maxStudents?: number | null;
    };
    requiresEditionSelection: boolean;
}

@Injectable()
export class EntitlementsService {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async getEntitlementsForTenant(tenantId: string): Promise<EffectiveEntitlements> {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        const editionFromId = tenant.editionId ? getCanonicalEditionByCode(tenant.editionId) : null;
        const editionFromMetadata = tenant.metadata?.editionCode
            ? getCanonicalEditionByCode(String(tenant.metadata.editionCode))
            : null;
        const edition = editionFromId ?? editionFromMetadata;

        const modules = this.buildBooleanMap(MODULE_KEYS, edition?.modules ?? []);
        const features = this.buildBooleanMap(FEATURE_KEYS, edition?.features ?? []);

        return {
            tenantId,
            edition: edition
                ? {
                    code: edition.code,
                    displayName: edition.displayName,
                    description: edition.description ?? null,
                    version: edition.version,
                }
                : null,
            modules,
            features,
            limits: edition?.limits,
            requiresEditionSelection: !edition,
        };
    }

    private buildBooleanMap<T extends string>(keys: readonly T[], enabled: readonly string[]): Record<T, boolean> {
        const enabledSet = new Set(enabled);
        return keys.reduce((acc, key) => {
            acc[key] = enabledSet.has(key);
            return acc;
        }, {} as Record<T, boolean>);
    }
}
