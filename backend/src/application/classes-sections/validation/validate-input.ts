import { z, ZodError, ZodTypeAny } from 'zod';
import { classesSectionsErrors } from '../errors';

export const validateInput = <S extends ZodTypeAny>(schema: S, input: unknown): z.infer<S> => {
    try {
        return schema.parse(input);
    } catch (err) {
        if (err instanceof ZodError) {
            const details = {
                errors: err.errors.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            };
            throw classesSectionsErrors.validation(details);
        }
        throw err;
    }
};
