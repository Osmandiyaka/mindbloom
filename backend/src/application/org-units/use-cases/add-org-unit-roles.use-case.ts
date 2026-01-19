import { Inject, Injectable } from '@nestjs/common';
import {
    ORG_UNIT_REPOSITORY,
    ORG_UNIT_ROLE_REPOSITORY,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IOrgUnitRoleRepository } from '../../../domain/ports/out/org-unit-role-repository.port';
import { IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { AddOrgUnitRolesInput } from '../dto/add-org-unit-roles.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class AddOrgUnitRolesUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: AddOrgUnitRolesInput) {
        const command = validateInput(AddOrgUnitRolesInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const roleIds = Array.from(new Set(command.roleIds.map(id => id.trim()).filter(Boolean)));
        if (!roleIds.length) {
            throw orgUnitErrors.validation({ roleIds: 'At least one roleId is required.' });
        }

        const roles = await Promise.all(roleIds.map(id => this.roleRepository.findById(id, command.tenantId)));
        const missing = roles.map((role, index) => (role ? null : roleIds[index])).filter(Boolean);
        if (missing.length) {
            throw orgUnitErrors.validation({ missingRoleIds: missing });
        }

        await this.orgUnitRoleRepository.addRoles(
            command.tenantId,
            command.orgUnitId,
            roleIds,
            command.scope,
            command.actorUserId ?? null,
        );

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitRolesAssigned',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            after: { roleIds, scope: command.scope },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return { success: true };
    }
}
