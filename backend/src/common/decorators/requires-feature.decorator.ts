import { SetMetadata } from '@nestjs/common';

export const FEATURE_REQUIREMENTS_KEY = 'feature:requirements';
export const FEATURE_REQUIRE_ANY_KEY = 'feature:requirements:any';

export type FeatureCheckMode = 'BOOLEAN_TRUE' | 'EQUALS' | 'GTE';

export interface FeatureRequirement {
    key: string;
    expectedValue?: string;
    mode?: FeatureCheckMode;
    message?: string;
}

export function RequiresFeature(key: string, options: Partial<FeatureRequirement> = {}) {
    const requirement: FeatureRequirement = {
        key,
        expectedValue: options.expectedValue,
        mode: options.mode,
        message: options.message,
    };
    return SetMetadata(FEATURE_REQUIREMENTS_KEY, [requirement]);
}

export function RequiresAnyFeature(keys: string[], options: Partial<FeatureRequirement> = {}) {
    const values = keys.map((key) => ({ key, expectedValue: options.expectedValue, mode: options.mode, message: options.message }));
    return SetMetadata(FEATURE_REQUIRE_ANY_KEY, values);
}
