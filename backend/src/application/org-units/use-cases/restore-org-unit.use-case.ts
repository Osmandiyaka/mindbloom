import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { RestoreOrgUnitInput } from '../dto/restore-org-unit.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class RestoreOrgUnitUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: RestoreOrgUnitInput) {
        const command = validateInput(RestoreOrgUnitInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const descendants = await this.orgUnitRepository.findDescendants(command.tenantId, unit.id);
        const idsToRestore = [unit.id, ...descendants.map(item => item.id)];
        await this.orgUnitRepository.updateMany(idsToRestore, command.tenantId, {
            status: 'active',
            archivedAt: null,
            updatedBy: command.actorUserId ?? null,
        });

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitRestored',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            after: {
                id: unit.id,
                status: 'active',
                descendantUnitsCount: descendants.length,
            },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return { success: true };
    }
}
