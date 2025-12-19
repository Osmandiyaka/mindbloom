import { FeatureDefinition } from './feature-definition';
import { FeatureValueType } from './feature-value-type';
import { InvalidFeatureValueException } from '../exceptions/invalid-feature-value.exception';

export class FeatureValueParser {
    static validate(definition: FeatureDefinition, raw: string): void {
        this.parse(definition, raw);
    }

    static parse(definition: FeatureDefinition, raw: string): boolean | number | string {
        switch (definition.valueType) {
            case FeatureValueType.BOOLEAN: {
                if (raw === 'true' || raw === 'false') {
                    return raw === 'true';
                }
                throw new InvalidFeatureValueException(definition.key, 'boolean', raw);
            }
            case FeatureValueType.INT: {
                if (/^-?\d+$/.test(raw)) {
                    return parseInt(raw, 10);
                }
                throw new InvalidFeatureValueException(definition.key, 'int', raw);
            }
            case FeatureValueType.DECIMAL: {
                if (!Number.isNaN(Number(raw))) {
                    return Number(raw);
                }
                throw new InvalidFeatureValueException(definition.key, 'decimal', raw);
            }
            case FeatureValueType.STRING:
            default:
                return raw;
        }
    }
}
