import { FeatureValueType } from './feature-value-type';

export interface FeatureDefinitionProps {
    key: string;
    displayName: string;
    valueType: FeatureValueType;
    defaultValue: string;
    parentKey?: string;
    scope?: 'tenant' | 'host';
    moduleKey?: string;
}

export class FeatureDefinition {
    readonly key: string;
    readonly displayName: string;
    readonly valueType: FeatureValueType;
    readonly defaultValue: string;
    readonly parentKey?: string;
    readonly scope: 'tenant' | 'host';
    readonly moduleKey?: string;

    private constructor(props: FeatureDefinitionProps) {
        this.key = props.key;
        this.displayName = props.displayName;
        this.valueType = props.valueType;
        this.defaultValue = props.defaultValue;
        this.parentKey = props.parentKey;
        this.scope = props.scope ?? 'tenant';
        this.moduleKey = props.moduleKey;
    }

    static create(props: FeatureDefinitionProps): FeatureDefinition {
        const key = props.key?.trim();
        if (!key) {
            throw new Error('Feature key is required');
        }

        if (!props.displayName?.trim()) {
            throw new Error('Feature display name is required');
        }

        return new FeatureDefinition({ ...props, key });
    }
}
