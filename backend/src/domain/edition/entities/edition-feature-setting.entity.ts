import { FeatureCatalog } from '../../features/feature-catalog';
import { FeatureValueParser } from '../../features/feature-value-parser';
import { UnknownFeatureKeyException } from '../../exceptions/unknown-feature-key.exception';

export interface EditionFeatureSettingProps {
    editionId: string;
    featureKey: string;
    value: string;
}

export class EditionFeatureSetting {
    readonly editionId: string;
    readonly featureKey: string;
    private _value: string;

    private constructor(props: EditionFeatureSettingProps) {
        this.editionId = props.editionId;
        this.featureKey = props.featureKey;
        this._value = props.value;
    }

    static create(props: EditionFeatureSettingProps, catalog: typeof FeatureCatalog = FeatureCatalog): EditionFeatureSetting {
        const definition = catalog.get(props.featureKey);
        if (!definition) {
            throw new UnknownFeatureKeyException(props.featureKey);
        }
        FeatureValueParser.validate(definition, props.value);
        return new EditionFeatureSetting(props);
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
