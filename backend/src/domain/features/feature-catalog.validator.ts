import { FeatureDefinition } from './feature-definition';
import { FeatureValueParser } from './feature-value-parser';
import { InvalidFeatureHierarchyException } from '../exceptions/invalid-feature-hierarchy.exception';
import { UnknownFeatureKeyException } from '../exceptions/unknown-feature-key.exception';
import { FeatureScope } from './feature-scope';

export class FeatureCatalogValidator {
    static validate(definitions: FeatureDefinition[]): void {
        const keyMap = new Map<string, FeatureDefinition>();

        for (const def of definitions) {
            const key = def.key.toLowerCase();
            if (!this.isValidKeyFormat(def.key)) {
                throw new Error(`Invalid feature key format '${def.key}'. Use dot-separated segments without spaces.`);
            }
            if (keyMap.has(key)) {
                throw new Error(`Duplicate feature key '${def.key}' in catalog.`);
            }
            keyMap.set(key, def);
        }

        // Validate parents, cycles, and defaults
        for (const def of definitions) {
            if (def.parentKey) {
                const parent = keyMap.get(def.parentKey.toLowerCase());
                if (!parent) {
                    throw new InvalidFeatureHierarchyException(def.key, def.parentKey);
                }
                this.ensureNoCycle(def, keyMap);
            }

            FeatureValueParser.validateValue(def.valueType, def.defaultValue, def.key);
        }
    }

    static isValidKeyFormat(key: string): boolean {
        return /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)+$/.test(key.trim());
    }

    private static ensureNoCycle(def: FeatureDefinition, keyMap: Map<string, FeatureDefinition>): void {
        const visited = new Set<string>();
        let current: FeatureDefinition | undefined = def;
        while (current?.parentKey) {
            const parentKey = current.parentKey.toLowerCase();
            if (visited.has(parentKey)) {
                throw new Error(`Cycle detected in feature hierarchy at '${current.key}'.`);
            }
            visited.add(parentKey);
            current = keyMap.get(parentKey);
            if (!current) {
                throw new UnknownFeatureKeyException(parentKey);
            }
        }
    }
}
