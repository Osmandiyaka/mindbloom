export class InvalidFeatureHierarchyException extends Error {
    constructor(featureKey: string, parentKey: string) {
        super(`Feature '${featureKey}' declares parent '${parentKey}', but the parent is not registered.`);
        this.name = 'InvalidFeatureHierarchyException';
    }
}
