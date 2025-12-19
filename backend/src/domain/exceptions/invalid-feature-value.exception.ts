export class InvalidFeatureValueException extends Error {
    constructor(featureKey: string, expectedType: string, value: string) {
        super(`Invalid value '${value}' for feature '${featureKey}'. Expected type: ${expectedType}.`);
        this.name = 'InvalidFeatureValueException';
    }
}
