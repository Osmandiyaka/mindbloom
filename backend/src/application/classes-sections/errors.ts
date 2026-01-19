export class ClassesSectionsDomainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status: number,
        public readonly details?: Record<string, any>,
    ) {
        super(message);
    }
}

export const classesSectionsErrors = {
    validation: (details?: Record<string, any>) =>
        new ClassesSectionsDomainError('Validation failed', 'validationError', 400, details),
    conflict: (message: string, details?: Record<string, any>) =>
        new ClassesSectionsDomainError(message, 'conflictError', 409, details),
    notFound: (message: string, details?: Record<string, any>) =>
        new ClassesSectionsDomainError(message, 'notFoundError', 404, details),
    forbidden: (message: string, details?: Record<string, any>) =>
        new ClassesSectionsDomainError(message, 'forbiddenError', 403, details),
};
