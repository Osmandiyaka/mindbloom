export class UnknownFeatureKeyException extends Error {
    constructor(featureKey: string) {
        super(`Unknown feature key '${featureKey}'. Ensure the feature is registered in the catalog.`);
        this.name = 'UnknownFeatureKeyException';
    }
}
