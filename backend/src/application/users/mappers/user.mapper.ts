import { User } from '../../../domain/entities/user.entity';
import { UserDto } from '../dto/user.dto';

export const toUserDto = (user: User): UserDto => ({
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    profilePicture: user.profilePicture ?? null,
    status: user.status,
    roleIds: user.roleIds,
    schoolAccess: user.schoolAccess,
    forcePasswordReset: user.forcePasswordReset,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
