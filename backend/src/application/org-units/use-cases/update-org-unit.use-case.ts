import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { orgUnitErrors } from '../errors';
import { toOrgUnitDto } from '../mappers/org-unit.mapper';
import { validateInput } from '../validation/validate-input';
import { UpdateOrgUnitInput } from '../dto/update-org-unit.input';
import { OrgUnit } from '../../../domain/org-units/org-unit.entity';

@Injectable()
export class UpdateOrgUnitUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: UpdateOrgUnitInput) {
        const command = validateInput(UpdateOrgUnitInput, input);
        const existing = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!existing) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const updated = OrgUnit.create({
            id: existing.id,
            tenantId: existing.tenantId,
            name: command.name?.trim() || existing.name,
            code: command.code !== undefined ? command.code : existing.code,
            type: command.type ?? existing.type,
            status: command.status ?? existing.status,
            parentId: existing.parentId,
            path: existing.path,
            depth: existing.depth,
            sortOrder: command.sortOrder ?? existing.sortOrder,
            createdBy: existing.createdBy,
            updatedBy: command.actorUserId ?? existing.updatedBy,
            archivedAt: command.status === 'archived' ? (existing.archivedAt ?? new Date()) : existing.archivedAt,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
        });

        const saved = await this.orgUnitRepository.update(updated);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitUpdated',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            before: {
                id: existing.id,
                name: existing.name,
                code: existing.code,
                type: existing.type,
                status: existing.status,
                sortOrder: existing.sortOrder,
            },
            after: {
                id: saved.id,
                name: saved.name,
                code: saved.code,
                type: saved.type,
                status: saved.status,
                sortOrder: saved.sortOrder,
            },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return toOrgUnitDto(saved);
    }
}
