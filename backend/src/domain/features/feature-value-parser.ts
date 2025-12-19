import { FeatureDefinition } from './feature-definition';
import { FeatureValueType } from './feature-value-type';
import { InvalidFeatureValueException } from '../exceptions/invalid-feature-value.exception';

export class FeatureValueParser {
    static validate(definition: FeatureDefinition, raw: string): void {
        this.validateValue(definition.valueType, raw, definition.key);
    }

    static validateValue(valueType: FeatureValueType, raw: string, featureKey?: string): void {
        switch (valueType) {
            case FeatureValueType.BOOLEAN:
                this.parseBoolean(raw, featureKey);
                return;
            case FeatureValueType.INT:
                this.parseInt(raw, featureKey);
                return;
            case FeatureValueType.DECIMAL:
                this.parseDecimal(raw, featureKey);
                return;
            case FeatureValueType.STRING:
            default:
                return;
        }
    }

    static parseBoolean(value: string, featureKey?: string): boolean {
        const normalized = value?.toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
        throw new InvalidFeatureValueException(featureKey ?? 'unknown', 'boolean', value);
    }

    static parseInt(value: string, featureKey?: string): number {
        if (/^-?\d+$/.test(value)) {
            return Number.parseInt(value, 10);
        }
        throw new InvalidFeatureValueException(featureKey ?? 'unknown', 'int', value);
    }

    static parseDecimal(value: string, featureKey?: string): number {
        const n = Number(value);
        if (!Number.isNaN(n)) {
            return n;
        }
        throw new InvalidFeatureValueException(featureKey ?? 'unknown', 'decimal', value);
    }
}
