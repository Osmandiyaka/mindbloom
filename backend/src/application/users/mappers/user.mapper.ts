import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { School } from '../../../domain/school/entities/school.entity';
import { RoleDto, SchoolDto, UserDto } from '../dto/user.dto';

const toRoleDto = (role: Role): RoleDto => ({
    id: role.id,
    tenantId: role.tenantId ?? null,
    name: role.name,
    description: role.description,
    scopeType: role.scopeType,
    status: role.status,
    isSystemRole: role.isSystemRole,
    isGlobal: role.isGlobal ?? false,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
});

const toSchoolDto = (school: School): SchoolDto => ({
    id: school.id,
    tenantId: school.tenantId,
    name: school.name,
    code: school.code,
    type: school.type,
    status: school.status,
    address: school.address,
    contact: school.contact,
    settings: school.settings,
    createdAt: school.createdAt,
    updatedAt: school.updatedAt,
});

export const toUserDto = (user: User, selectedSchools: School[] = []): UserDto => ({
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    profilePicture: user.profilePicture ?? null,
    status: user.status,
    roleIds: user.roleIds,
    roles: user.roles.map(toRoleDto),
    schoolAccess: user.schoolAccess,
    selectedSchools: selectedSchools.map(toSchoolDto),
    forcePasswordReset: user.forcePasswordReset,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
