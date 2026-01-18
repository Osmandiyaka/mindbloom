import { ConfigService } from '@nestjs/config';
import { SchoolAccess, UserStatus } from '../../domain/users/user.types';

export type UserDefaults = {
    status: UserStatus;
    schoolAccess: SchoolAccess;
};

export const resolveUserDefaults = (config: ConfigService): UserDefaults => {
    const status = (config.get<string>('USER_DEFAULT_STATUS') ?? 'active') as UserStatus;
    const schoolScope = (config.get<string>('USER_DEFAULT_SCHOOL_ACCESS_SCOPE') ?? 'all') as 'all' | 'selected';
    const schoolIds = config.get<string>('USER_DEFAULT_SCHOOL_ACCESS_IDS');
    if (schoolScope === 'selected') {
        const ids = (schoolIds ?? '')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
        return { status, schoolAccess: { scope: 'selected', schoolIds: ids } };
    }
    return { status, schoolAccess: { scope: 'all' } };
};
