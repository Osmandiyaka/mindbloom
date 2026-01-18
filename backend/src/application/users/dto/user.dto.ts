import { RoleScopeType, RoleStatus } from '../../../domain/rbac/entities/role.entity';
import {
    SchoolAddress,
    SchoolContact,
    SchoolSettings,
    SchoolStatus,
    SchoolType,
} from '../../../domain/school/entities/school.entity';
import { SchoolAccess, UserStatus } from '../../../domain/users/user.types';

export type RoleDto = {
    id: string;
    tenantId: string | null;
    name: string;
    description: string;
    scopeType: RoleScopeType;
    status: RoleStatus;
    isSystemRole: boolean;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type SchoolDto = {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    type: SchoolType;
    status: SchoolStatus;
    address?: SchoolAddress;
    contact?: SchoolContact;
    settings?: SchoolSettings;
    createdAt: Date;
    updatedAt: Date;
};

export type UserDto = {
    id: string;
    tenantId: string | null;
    email: string;
    name: string;
    phone: string | null;
    profilePicture: string | null;
    status: UserStatus;
    roleIds: string[];
    roles: RoleDto[];
    schoolAccess: SchoolAccess;
    selectedSchools: SchoolDto[];
    forcePasswordReset: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};
