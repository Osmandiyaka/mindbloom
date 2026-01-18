import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { ISchoolRepository } from '../../../domain/ports/out/school-repository.port';
import { USER_REPOSITORY, ROLE_REPOSITORY, SCHOOL_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { AuditService } from '../../services/audit/audit.service';
import { userErrors } from '../errors';
import { validateInput } from '../validation/validate-input';
import { UpdateUserInput } from './dto/update-user.input';
import { toUserDto } from '../mappers/user.mapper';

@Injectable()
export class UpdateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: UpdateUserInput) {
        const command = validateInput(UpdateUserInput, input);
        const user = await this.userRepository.findById(command.userId);
        if (!user || user.tenantId !== command.tenantId) {
            throw userErrors.notFound('User not found', { userId: command.userId });
        }

        const roleIds = command.roleIds
            ? Array.from(new Set(command.roleIds.map(id => id.trim()).filter(Boolean)))
            : user.roleIds;
        if (command.roleIds) {
            const roles = await Promise.all(roleIds.map(roleId => this.roleRepository.findById(roleId, command.tenantId)));
            const missing = roles.map((role, index) => (role ? null : roleIds[index])).filter(Boolean);
            if (missing.length) {
                throw userErrors.validation({ missingRoleIds: missing });
            }
        }

        const schoolAccess = command.schoolAccess
            ? (command.schoolAccess.scope === 'selected'
                ? { scope: 'selected' as const, schoolIds: command.schoolAccess.schoolIds ?? [] }
                : { scope: 'all' as const })
            : user.schoolAccess;
        if (command.schoolAccess && schoolAccess.scope === 'selected') {
            const schoolIds = Array.from(new Set((schoolAccess.schoolIds ?? []).map(id => id.trim()).filter(Boolean)));
            if (!schoolIds.length) {
                throw userErrors.validation({ schoolIds: 'At least one schoolId is required.' });
            }
            const schools = await Promise.all(schoolIds.map(id => this.schoolRepository.findById(id, command.tenantId)));
            const missing = schools.map((school, index) => (school ? null : schoolIds[index])).filter(Boolean);
            if (missing.length) {
                throw userErrors.validation({ missingSchoolIds: missing });
            }
        }

        const updated = user
            .updateProfile({
                name: command.name ?? user.name,
                phone: command.phone ?? user.phone,
                profilePicture: command.profilePicture ?? user.profilePicture,
                gender: command.gender ?? user.gender,
                dateOfBirth: command.dateOfBirth ? new Date(command.dateOfBirth) : user.dateOfBirth,
                status: command.status ?? user.status,
            })
            .assignRoles(roleIds)
            .setSchoolAccess(schoolAccess);

        const saved = await this.userRepository.update(updated);

        await this.audit.log({
            category: 'USER',
            action: 'UserUpdated',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            targetType: 'User',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            after: { id: saved.id, email: saved.email, status: saved.status, roleIds: saved.roleIds },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return toUserDto(saved);
    }
}
