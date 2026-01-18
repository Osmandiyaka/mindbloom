import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { ISchoolRepository } from '../../../domain/ports/out/school-repository.port';
import { USER_REPOSITORY, ROLE_REPOSITORY, SCHOOL_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { User } from '../../../domain/entities/user.entity';
import { AuditService } from '../../services/audit/audit.service';
import { userErrors } from '../errors';
import { validateInput } from '../validation/validate-input';
import { CreateUserInput } from './dto/create-user.input';
import { toUserDto } from '../mappers/user.mapper';
import { resolveUserDefaults } from '../user-defaults';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
        private readonly config: ConfigService,
    ) { }

    async execute(input: CreateUserInput) {
        const command = validateInput(CreateUserInput, input);
        const tenantId = command.tenantId;
        const defaults = resolveUserDefaults(this.config);
        const existing = await this.userRepository.findByEmailAndTenant(command.email, tenantId);
        if (existing) {
            throw userErrors.conflict('User with this email already exists', { email: command.email });
        }

        const roleIds = Array.from(new Set((command.roleIds ?? []).map(id => id.trim()).filter(Boolean)));
        if (roleIds.length) {
            const roles = await Promise.all(roleIds.map(roleId => this.roleRepository.findById(roleId, tenantId)));
            const missing = roles.map((role, index) => (role ? null : roleIds[index])).filter(Boolean);
            if (missing.length) {
                throw userErrors.validation({ missingRoleIds: missing });
            }
        }

        const schoolAccess = command.schoolAccess
            ? (command.schoolAccess.scope === 'selected'
                ? { scope: 'selected' as const, schoolIds: command.schoolAccess.schoolIds ?? [] }
                : { scope: 'all' as const })
            : defaults.schoolAccess;
        if (schoolAccess.scope === 'selected') {
            const schoolIds = Array.from(new Set((schoolAccess.schoolIds ?? []).map(id => id.trim()).filter(Boolean)));
            if (!schoolIds.length) {
                throw userErrors.validation({ schoolIds: 'At least one schoolId is required.' });
            }
            const schools = await Promise.all(schoolIds.map(id => this.schoolRepository.findById(id, tenantId)));
            const missing = schools.map((school, index) => (school ? null : schoolIds[index])).filter(Boolean);
            if (missing.length) {
                throw userErrors.validation({ missingSchoolIds: missing });
            }
        }

        const user = User.create({
            tenantId,
            email: command.email,
            name: command.name,
            phone: command.phone ?? null,
            profilePicture: command.profilePicture ?? null,
            gender: command.gender ?? null,
            dateOfBirth: command.dateOfBirth ? new Date(command.dateOfBirth) : null,
            status: command.status ?? defaults.status,
            roleIds,
            schoolAccess,
            forcePasswordReset: command.forcePasswordReset ?? false,
            mfaEnabled: command.mfaEnabled ?? false,
        });

        const created = await this.userRepository.create(user, command.password);

        await this.audit.log({
            category: 'USER',
            action: 'UserCreated',
            scope: 'TENANT',
            tenantId,
            actorType: 'TENANT_USER',
            targetType: 'User',
            targetId: created.id,
            targetNameSnapshot: created.name,
            after: { id: created.id, email: created.email, roleIds: created.roleIds, status: created.status },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return toUserDto(created);
    }
}
