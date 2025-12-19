import { FeatureDefinition } from './feature-definition';
import { FeatureValueType } from './feature-value-type';
import { FeatureValueParser } from './feature-value-parser';
import { InvalidFeatureHierarchyException } from '../exceptions/invalid-feature-hierarchy.exception';
import { UnknownFeatureKeyException } from '../exceptions/unknown-feature-key.exception';

export class FeatureCatalog {
    private readonly definitions = new Map<string, FeatureDefinition>();

    register(definitions: FeatureDefinition[]): void {
        for (const def of definitions) {
            const key = def.key.toLowerCase();
            if (this.definitions.has(key)) {
                throw new Error(`Duplicate feature key '${def.key}' in catalog registration.`);
            }
            this.definitions.set(key, def);
        }

        // Validate parents after all are registered
        for (const def of definitions) {
            if (def.parentKey) {
                const parent = this.definitions.get(def.parentKey.toLowerCase());
                if (!parent) {
                    throw new InvalidFeatureHierarchyException(def.key, def.parentKey);
                }
            }

            // Validate default value matches value type
            FeatureValueParser.validate(def, def.defaultValue);
        }
    }

    get(key: string): FeatureDefinition {
        const def = this.definitions.get(key.toLowerCase());
        if (!def) {
            throw new UnknownFeatureKeyException(key);
        }
        return def;
    }

    has(key: string): boolean {
        return this.definitions.has(key.toLowerCase());
    }

    all(): FeatureDefinition[] {
        return Array.from(this.definitions.values());
    }
}
