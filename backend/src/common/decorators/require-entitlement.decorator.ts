import { SetMetadata } from '@nestjs/common';
import { FeatureKey, ModuleKey } from '../../domain/entitlements/entitlements.keys';

export const REQUIRED_MODULE_KEY = 'required_module';
export const REQUIRED_FEATURE_KEY = 'required_feature';

export const RequireModule = (moduleKey: ModuleKey) => SetMetadata(REQUIRED_MODULE_KEY, moduleKey);
export const RequireFeature = (featureKey: FeatureKey) => SetMetadata(REQUIRED_FEATURE_KEY, featureKey);
