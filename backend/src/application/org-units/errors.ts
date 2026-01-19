export class OrgUnitDomainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status: number,
        public readonly details?: Record<string, any>,
    ) {
        super(message);
    }
}

export const orgUnitErrors = {
    validation: (details?: Record<string, any>) =>
        new OrgUnitDomainError('Validation failed', 'validationError', 400, details),
    conflict: (message: string, details?: Record<string, any>) =>
        new OrgUnitDomainError(message, 'conflictError', 409, details),
    notFound: (message: string, details?: Record<string, any>) =>
        new OrgUnitDomainError(message, 'notFoundError', 404, details),
    forbidden: (message: string, details?: Record<string, any>) =>
        new OrgUnitDomainError(message, 'forbiddenError', 403, details),
};
