export interface IFeatureValueProvider {
    getEffectiveFeaturesForTenant(tenantId: string): Promise<Record<string, string>>;
    getFeatureValue(tenantId: string, featureKey: string): Promise<string>;
    getBoolean(tenantId: string, featureKey: string): Promise<boolean>;
    getInt(tenantId: string, featureKey: string): Promise<number>;
    getDecimal(tenantId: string, featureKey: string): Promise<number>;
    invalidateTenantFeatureCache(tenantId: string): Promise<void>;
    invalidateEditionImpactCache(editionId: string): Promise<void>;
    explainFeatureValue?(tenantId: string, featureKey: string): Promise<any>;
}
