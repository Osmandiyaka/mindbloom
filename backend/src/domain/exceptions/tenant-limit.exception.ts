export class TenantLimitExceededException extends Error {
    constructor(
        public readonly tenantId: string,
        public readonly limitKey: string,
        public readonly max: number,
        public readonly attempted: number,
    ) {
        super(`Tenant '${tenantId}' exceeded limit '${limitKey}' (max=${max}, attempted=${attempted}).`);
        this.name = 'TenantLimitExceededException';
    }
}
