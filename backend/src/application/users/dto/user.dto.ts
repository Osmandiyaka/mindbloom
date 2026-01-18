import { SchoolAccess, UserStatus } from '../../../domain/users/user.types';

export type UserDto = {
    id: string;
    tenantId: string | null;
    email: string;
    name: string;
    phone: string | null;
    profilePicture: string | null;
    status: UserStatus;
    roleIds: string[];
    schoolAccess: SchoolAccess;
    forcePasswordReset: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};
