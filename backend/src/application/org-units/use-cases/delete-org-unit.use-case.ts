import { Inject, Injectable } from '@nestjs/common';
import {
    ORG_UNIT_MEMBER_REPOSITORY,
    ORG_UNIT_REPOSITORY,
    ORG_UNIT_ROLE_REPOSITORY,
} from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IOrgUnitMemberRepository } from '../../../domain/ports/out/org-unit-member-repository.port';
import { IOrgUnitRoleRepository } from '../../../domain/ports/out/org-unit-role-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { DeleteOrgUnitInput } from '../dto/delete-org-unit.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class DeleteOrgUnitUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: DeleteOrgUnitInput) {
        const command = validateInput(DeleteOrgUnitInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const descendants = await this.orgUnitRepository.findDescendants(command.tenantId, unit.id);
        const descendantIds = descendants.map(item => item.id);
        const membersDirectCount = await this.orgUnitMemberRepository.countMembers(command.tenantId, [unit.id]);
        const membersInheritedCount = await this.orgUnitMemberRepository.countMembers(command.tenantId, descendantIds);
        const roleAssignmentsCount = await this.orgUnitRoleRepository.countAssignments(command.tenantId, [unit.id]);
        const rolesInheritedImpactCount = await this.orgUnitRoleRepository.countAssignments(command.tenantId, descendantIds);

        const requiresConfirmation = descendants.length > 0
            || membersDirectCount > 0
            || membersInheritedCount > 0
            || roleAssignmentsCount > 0
            || rolesInheritedImpactCount > 0;

        if (requiresConfirmation) {
            const expected = unit.name.trim();
            const provided = command.confirmationText?.trim();
            if (!provided || provided !== expected) {
                throw orgUnitErrors.validation({ confirmationText: 'Confirmation text must match the org unit name.' });
            }
        }

        const now = new Date();
        const idsToArchive = [unit.id, ...descendantIds];
        await this.orgUnitRepository.updateMany(idsToArchive, command.tenantId, {
            status: 'archived',
            archivedAt: now,
            updatedBy: command.actorUserId ?? null,
        });

        await this.orgUnitMemberRepository.removeByOrgUnitIds(command.tenantId, idsToArchive);
        await this.orgUnitRoleRepository.removeByOrgUnitIds(command.tenantId, idsToArchive);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitArchived',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            before: {
                id: unit.id,
                status: unit.status,
                archivedAt: unit.archivedAt,
            },
            after: {
                id: unit.id,
                status: 'archived',
                archivedAt: now,
                descendantUnitsCount: descendants.length,
            },
            result: 'SUCCESS',
            severity: 'WARN',
        });

        return { success: true };
    }
}
