import { FeatureValueType } from './feature-value-type';
import { FeatureScope } from './feature-scope';

export interface FeatureDefinitionProps {
    key: string;
    displayName: string;
    description?: string;
    category: string;
    valueType: FeatureValueType;
    defaultValue: string;
    scope: FeatureScope;
    parentKey?: string;
    moduleKey?: string;
    isVisibleToTenantAdmin: boolean;
    isVisibleToHostAdmin: boolean;
    sortOrder?: number;
    tags?: string[];
}

export class FeatureDefinition {
    readonly key: string;
    readonly displayName: string;
    readonly description?: string;
    readonly category: string;
    readonly valueType: FeatureValueType;
    readonly defaultValue: string;
    readonly scope: FeatureScope;
    readonly parentKey?: string;
    readonly moduleKey?: string;
    readonly isVisibleToTenantAdmin: boolean;
    readonly isVisibleToHostAdmin: boolean;
    readonly sortOrder?: number;
    readonly tags?: string[];

    private constructor(props: FeatureDefinitionProps) {
        this.key = props.key;
        this.displayName = props.displayName;
        this.description = props.description;
        this.category = props.category;
        this.valueType = props.valueType;
        this.defaultValue = props.defaultValue;
        this.scope = props.scope;
        this.parentKey = props.parentKey;
        this.moduleKey = props.moduleKey;
        this.isVisibleToTenantAdmin = props.isVisibleToTenantAdmin;
        this.isVisibleToHostAdmin = props.isVisibleToHostAdmin;
        this.sortOrder = props.sortOrder;
        this.tags = props.tags;
    }

    static create(props: FeatureDefinitionProps): FeatureDefinition {
        const key = props.key?.trim();
        if (!key) {
            throw new Error('Feature key is required');
        }

        if (!props.displayName?.trim()) {
            throw new Error('Feature display name is required');
        }

        if (!props.category?.trim()) {
            throw new Error('Feature category is required');
        }

        return new FeatureDefinition({ ...props, key });
    }
}
