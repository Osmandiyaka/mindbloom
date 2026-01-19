import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_REPOSITORY, ORG_UNIT_ROLE_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IOrgUnitRoleRepository } from '../../../domain/ports/out/org-unit-role-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { RemoveOrgUnitRoleInput } from '../dto/remove-org-unit-role.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class RemoveOrgUnitRoleUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: RemoveOrgUnitRoleInput) {
        const command = validateInput(RemoveOrgUnitRoleInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        await this.orgUnitRoleRepository.removeRole(command.tenantId, command.orgUnitId, command.roleId);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitRoleRemoved',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            after: { roleId: command.roleId },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return { success: true };
    }
}
