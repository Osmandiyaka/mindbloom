import { TENANT_FEATURE_OVERRIDE_REPOSITORY } from './repository.tokens';

export interface ITenantFeatureOverrideRepository {
    findMapByTenantId(tenantId: string): Promise<Record<string, string>>;
}

export { TENANT_FEATURE_OVERRIDE_REPOSITORY };
