import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { orgUnitErrors } from '../errors';

export const validateInput = <T>(cls: new () => T, input: unknown): T => {
    const instance = plainToInstance(cls, input, { enableImplicitConversion: true });
    const errors = validateSync(instance as object, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
        const details = {
            fields: errors.flatMap(err => err.constraints ? Object.keys(err.constraints) : []),
            errors: errors.map(err => ({
                field: err.property,
                constraints: err.constraints ?? {},
            })),
        };
        throw orgUnitErrors.validation(details);
    }
    return instance;
};
