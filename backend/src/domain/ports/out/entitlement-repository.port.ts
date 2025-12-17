import { ENTITLEMENT_REPOSITORY } from './repository.tokens';
import { ModuleKey } from '../../subscription/entities/plan.entity';

export interface EntitlementRepository {
    upsertMany(tenantId: string, planId: string, modules: Array<{ moduleKey: ModuleKey; enabled: boolean }>): Promise<void>;
    disableMissingModules(tenantId: string, planId: string, moduleKeys: ModuleKey[]): Promise<void>;
    findByTenantAndModule(tenantId: string, moduleKey: ModuleKey): Promise<{ enabled: boolean; sourcePlanId?: string } | null>;
}

export { ENTITLEMENT_REPOSITORY } from './repository.tokens';
