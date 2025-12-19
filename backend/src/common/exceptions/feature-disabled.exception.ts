import { ForbiddenException } from '@nestjs/common';

export class FeatureDisabledException extends ForbiddenException {
    constructor(featureKey: string, message: string) {
        super({
            error: 'FEATURE_DISABLED',
            featureKey,
            message,
        });
    }
}
