import { FeatureCatalog } from '../../features/feature-catalog';
import { FeatureValueParser } from '../../features/feature-value-parser';
import { UnknownFeatureKeyException } from '../../exceptions/unknown-feature-key.exception';

export interface TenantFeatureOverrideProps {
    tenantId: string;
    featureKey: string;
    value: string;
}

export class TenantFeatureOverride {
    readonly tenantId: string;
    readonly featureKey: string;
    private _value: string;

    private constructor(props: TenantFeatureOverrideProps) {
        this.tenantId = props.tenantId;
        this.featureKey = props.featureKey;
        this._value = props.value;
    }

    static create(props: TenantFeatureOverrideProps, catalog: typeof FeatureCatalog = FeatureCatalog): TenantFeatureOverride {
        const definition = catalog.get(props.featureKey);
        if (!definition) {
            throw new UnknownFeatureKeyException(props.featureKey);
        }
        FeatureValueParser.validate(definition, props.value);
        return new TenantFeatureOverride(props);
    }

    get value(): string {
        return this._value;
    }

    setValue(raw: string, catalog: typeof FeatureCatalog = FeatureCatalog): void {
        const definition = catalog.get(this.featureKey);
        FeatureValueParser.validate(definition, raw);
        this._value = raw;
    }
}
