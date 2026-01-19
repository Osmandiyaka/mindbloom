import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_MEMBER_REPOSITORY, ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitMemberRepository } from '../../../domain/ports/out/org-unit-member-repository.port';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { RemoveOrgUnitMemberInput } from '../dto/remove-org-unit-member.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class RemoveOrgUnitMemberUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: RemoveOrgUnitMemberInput) {
        const command = validateInput(RemoveOrgUnitMemberInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        await this.orgUnitMemberRepository.removeMember(command.tenantId, command.orgUnitId, command.userId);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitMemberRemoved',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            after: { userId: command.userId },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return { success: true };
    }
}
