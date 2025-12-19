import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeatureCatalog } from '../../../domain/features/feature-catalog';
import { FeatureValueParser } from '../../../domain/features/feature-value-parser';
import { FeatureValueType } from '../../../domain/features/feature-value-type';
import { InvalidFeatureValueException } from '../../../domain/exceptions/invalid-feature-value.exception';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { EditionManager } from '../subscription/edition-manager.service';
import { ITenantFeatureOverrideRepository, TENANT_FEATURE_OVERRIDE_REPOSITORY } from '../../../domain/ports/out/tenant-feature-override-repository.port';
import { TenantNotFoundException } from '../../../domain/exceptions/tenant-subscription.exception';

export type FeatureResolutionSource = 'DEFAULT' | 'EDITION' | 'TENANT_OVERRIDE' | 'PARENT_GATED';

export interface FeatureExplanation {
    tenantId: string;
    featureKey: string;
    valueType: FeatureValueType;
    effectiveValue: string;
    resolvedBy: FeatureResolutionSource;
    steps: string[];
    sources: {
        defaultValue: string;
        editionId?: string | null;
        editionValue?: string;
        overrideValue?: string;
        parentGate?: Array<{ parentKey: string; parentEffectiveValue: string }>;
    };
    warnings: string[];
}

@Injectable()
export class FeatureValidationService {
    private readonly logger = new Logger(FeatureValidationService.name);

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly editionManager: EditionManager,
        @Inject(TENANT_FEATURE_OVERRIDE_REPOSITORY) private readonly overrides: ITenantFeatureOverrideRepository,
    ) { }

    validateValue(featureKey: string, rawValue: string): void {
        const def = FeatureCatalog.get(featureKey);
        FeatureValueParser.validate(def, rawValue);
        this.applyRule(def.key, def.valueType, rawValue);
    }

    validateAssignments(assignments: Array<{ featureKey: string; value: string }>): void {
        const seen = new Set<string>();
        for (const entry of assignments || []) {
            const key = entry.featureKey?.trim();
            if (!key) continue;
            if (seen.has(key.toLowerCase())) {
                throw new InvalidFeatureValueException(key, 'duplicate', entry.value as any);
            }
            seen.add(key.toLowerCase());
            this.validateValue(key, entry.value);
        }
    }

    applyParentGating(effective: Record<string, string>): Record<string, string> {
        const next: Record<string, string> = { ...effective };
        for (const def of FeatureCatalog.ALL_FEATURES) {
            if (def.valueType !== FeatureValueType.BOOLEAN) continue;
            const ancestors = FeatureCatalog.getAncestors(def.key);
            for (const ancestor of ancestors) {
                if (ancestor.valueType !== FeatureValueType.BOOLEAN) continue;
                try {
                    const ancestorValue = next[ancestor.key] ?? ancestor.defaultValue;
                    const enabled = FeatureValueParser.parseBoolean(ancestorValue, ancestor.key);
                    if (!enabled) {
                        next[def.key] = 'false';
                        break;
                    }
                } catch (error) {
                    if (error instanceof InvalidFeatureValueException) {
                        this.logger.warn(`Invalid ancestor value for gating: ${ancestor.key}=${next[ancestor.key]} (${def.key})`);
                    }
                }
            }
        }
        return next;
    }

    async explainFeatureValue(tenantId: string, featureKey: string): Promise<FeatureExplanation> {
        const def = FeatureCatalog.get(featureKey);
        const tenant = await this.tenants.findById(tenantId);
        if (!tenant) {
            throw new TenantNotFoundException(tenantId);
        }

        const warnings: string[] = [];
        const steps: string[] = [];
        const sources: FeatureExplanation['sources'] = { defaultValue: def.defaultValue };

        const baseMap: Record<string, string> = {};
        for (const f of FeatureCatalog.ALL_FEATURES) {
            baseMap[f.key] = f.defaultValue;
        }
        steps.push(`default applied (${def.defaultValue})`);

        if (tenant.editionId) {
            try {
                const { features } = await this.editionManager.getEditionWithFeatures(tenant.editionId);
                for (const [key, value] of Object.entries(features || {})) {
                    try {
                        this.validateValue(key, value);
                        baseMap[key] = value;
                        if (key === def.key) {
                            sources.editionId = tenant.editionId;
                            sources.editionValue = value;
                            steps.push(`edition applied (${value})`);
                        }
                    } catch (error) {
                        if (key === def.key) {
                            warnings.push(`Edition value invalid for ${def.key}; using prior value.`);
                            this.safeLogInvalid(def.key, value, 'edition', tenantId, tenant.editionId || undefined);
                        }
                    }
                }
            } catch (err) {
                warnings.push(`Edition ${tenant.editionId} not found while explaining feature.`);
            }
        }

        const overrideMap = await this.overrides.findMapByTenantId(tenant.id);
        for (const [key, value] of Object.entries(overrideMap || {})) {
            try {
                this.validateValue(key, value);
                baseMap[key] = value;
                if (key === def.key) {
                    sources.overrideValue = value;
                    steps.push(`override applied (${value})`);
                }
            } catch (error) {
                if (key === def.key) {
                    warnings.push(`Override value invalid for ${def.key}; using prior value.`);
                    this.safeLogInvalid(def.key, value, 'override', tenantId, tenant.editionId || undefined);
                }
            }
        }

        const beforeGating = baseMap[def.key];
        const gated = this.applyParentGating(baseMap);
        const afterGating = gated[def.key];
        const parentGate: Array<{ parentKey: string; parentEffectiveValue: string }> = [];
        if (beforeGating !== afterGating) {
            const ancestors = FeatureCatalog.getAncestors(def.key).filter(a => a.valueType === FeatureValueType.BOOLEAN);
            for (const ancestor of ancestors) {
                parentGate.push({ parentKey: ancestor.key, parentEffectiveValue: gated[ancestor.key] ?? ancestor.defaultValue });
            }
            sources.parentGate = parentGate;
            steps.push('parent gating applied');
        }

        const resolvedBy: FeatureResolutionSource = afterGating !== beforeGating
            ? 'PARENT_GATED'
            : sources.overrideValue !== undefined
                ? 'TENANT_OVERRIDE'
                : sources.editionValue !== undefined
                    ? 'EDITION'
                    : 'DEFAULT';

        return {
            tenantId,
            featureKey: def.key,
            valueType: def.valueType,
            effectiveValue: afterGating,
            resolvedBy,
            steps,
            sources,
            warnings,
        };
    }

    private applyRule(featureKey: string, valueType: FeatureValueType, rawValue: string): void {
        const rule = this.getRule(featureKey);
        if (!rule) return;
        rule(valueType, rawValue, featureKey);
    }

    private getRule(featureKey: string): ((valueType: FeatureValueType, raw: string, key: string) => void) | null {
        const nonNegativeInt = (valueType: FeatureValueType, raw: string, key: string) => {
            const n = FeatureValueParser.parseInt(raw, key);
            if (n < 0) throw new InvalidFeatureValueException(key, valueType, raw);
        };
        const nonNegativeDecimal = (valueType: FeatureValueType, raw: string, key: string) => {
            const n = FeatureValueParser.parseDecimal(raw, key);
            if (n < 0) throw new InvalidFeatureValueException(key, valueType, raw);
        };

        const registry: Record<string, (valueType: FeatureValueType, raw: string, key: string) => void> = {
            'limits.students.max': nonNegativeInt,
            'limits.staff.max': nonNegativeInt,
            'limits.parents.max': nonNegativeInt,
            'limits.storage.gb': nonNegativeDecimal,
            'subscription.gracePeriodDays': nonNegativeInt,
        };

        return registry[featureKey.toLowerCase()] ?? null;
    }

    private safeLogInvalid(featureKey: string, rawValue: string, source: string, tenantId: string, editionId?: string): void {
        this.logger.warn(`Invalid feature value ignored (${source}): ${featureKey}=${rawValue} tenant=${tenantId} edition=${editionId ?? 'n/a'}`);
    }
}
