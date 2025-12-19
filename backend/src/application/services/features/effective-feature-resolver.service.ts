import { Inject, Injectable, Logger } from '@nestjs/common';
import { EditionManager } from '../subscription/edition-manager.service';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { IFeatureValueProvider } from './feature-value-provider.interface';
import { FeatureCatalog } from '../../../domain/features/feature-catalog';
import { FeatureValueParser } from '../../../domain/features/feature-value-parser';
import { InvalidFeatureValueException } from '../../../domain/exceptions/invalid-feature-value.exception';
import { ITenantFeatureOverrideRepository, TENANT_FEATURE_OVERRIDE_REPOSITORY } from '../../../domain/ports/out/tenant-feature-override-repository.port';
import { TenantNotFoundException } from '../../../domain/exceptions/tenant-subscription.exception';
import { FeatureValidationService } from './feature-validation.service';

interface CacheEntry {
    expiresAt: number;
    value: Record<string, string>;
}

@Injectable()
export class EffectiveFeatureResolver implements IFeatureValueProvider {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly warnDedup = new Map<string, number>();
    private readonly ttlMs = 3 * 60 * 1000; // 3 minutes
    private readonly dedupTtlMs = 3 * 60 * 1000; // dedupe window aligned with cache
    private readonly logger = new Logger(EffectiveFeatureResolver.name);

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly editionManager: EditionManager,
        @Inject(TENANT_FEATURE_OVERRIDE_REPOSITORY) private readonly overrides: ITenantFeatureOverrideRepository,
        private readonly validator: FeatureValidationService,
    ) { }

    async getEffectiveFeaturesForTenant(tenantId: string): Promise<Record<string, string>> {
        const cached = this.cache.get(tenantId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        const tenant = await this.tenants.findById(tenantId);
        if (!tenant) {
            throw new TenantNotFoundException(tenantId);
        }

        const effective: Record<string, string> = {};
        for (const def of FeatureCatalog.ALL_FEATURES) {
            effective[def.key] = def.defaultValue;
        }

        if (tenant.editionId) {
            try {
                const { features } = await this.editionManager.getEditionWithFeatures(tenant.editionId);
                this.applyAssignments(effective, features, tenantId, tenant.editionId, 'edition');
            } catch (err) {
                this.logOnce('warn', `edition-missing-${tenant.editionId}`, `Edition '${tenant.editionId}' not found while resolving features`, {
                    tenantId,
                    editionId: tenant.editionId,
                });
            }
        }

        const overrides = await this.overrides.findMapByTenantId(tenantId);
        this.applyAssignments(effective, overrides, tenantId, tenant.editionId ?? null, 'override');

        const gated = this.validator.applyParentGating(effective);

        const value = { ...gated };
        this.cache.set(tenantId, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
    }

    async getFeatureValue(tenantId: string, featureKey: string): Promise<string> {
        const def = FeatureCatalog.get(featureKey);
        const map = await this.getEffectiveFeaturesForTenant(tenantId);
        return map[def.key] ?? def.defaultValue;
    }

    async getBoolean(tenantId: string, featureKey: string): Promise<boolean> {
        const def = FeatureCatalog.get(featureKey);
        const value = await this.getFeatureValue(tenantId, def.key);
        return FeatureValueParser.parseBoolean(value, def.key);
    }

    async getInt(tenantId: string, featureKey: string): Promise<number> {
        const def = FeatureCatalog.get(featureKey);
        const value = await this.getFeatureValue(tenantId, def.key);
        return FeatureValueParser.parseInt(value, def.key);
    }

    async getDecimal(tenantId: string, featureKey: string): Promise<number> {
        const def = FeatureCatalog.get(featureKey);
        const value = await this.getFeatureValue(tenantId, def.key);
        return FeatureValueParser.parseDecimal(value, def.key);
    }

    async invalidateTenantFeatureCache(tenantId: string): Promise<void> {
        this.cache.delete(tenantId);
    }

    async invalidateEditionImpactCache(_editionId: string): Promise<void> {
        // editionManager already caches per-edition; we rely on its TTL. Clear tenant maps to refresh quickly.
        this.cache.clear();
    }

    async explainFeatureValue(tenantId: string, featureKey: string) {
        return this.validator.explainFeatureValue(tenantId, featureKey);
    }

    private applyAssignments(
        effective: Record<string, string>,
        assignments: Record<string, string>,
        tenantId: string,
        editionId: string | null,
        source: 'edition' | 'override',
    ): void {
        for (const [rawKey, rawValue] of Object.entries(assignments || {})) {
            const def = FeatureCatalog.tryGet(rawKey.toLowerCase());
            if (!def) {
                this.logOnce('warn', `${source}-unknown-${rawKey}`, `Unknown feature key '${rawKey}' in ${source} data`, {
                    tenantId,
                    editionId,
                    featureKey: rawKey,
                    source,
                });
                continue;
            }

            try {
                this.validator.validateValue(def.key, rawValue);
                effective[def.key] = rawValue;
            } catch (error) {
                const isInvalid = error instanceof InvalidFeatureValueException;
                this.logOnce(isInvalid ? 'warn' : 'error', `${source}-invalid-${def.key}`, `Invalid feature value for '${def.key}' from ${source}`, {
                    tenantId,
                    editionId,
                    featureKey: def.key,
                    value: rawValue,
                    source,
                });
            }
        }
    }

    private logOnce(level: 'warn' | 'error', code: string, message: string, meta: Record<string, any>): void {
        const now = Date.now();
        const expires = this.warnDedup.get(code) || 0;
        if (expires > now) return;
        this.warnDedup.set(code, now + this.dedupTtlMs);
        const payload = JSON.stringify({ code, ...meta });
        if (level === 'warn') {
            this.logger.warn(`${message} ${payload}`);
        } else {
            this.logger.error(`${message} ${payload}`);
        }
    }
}
