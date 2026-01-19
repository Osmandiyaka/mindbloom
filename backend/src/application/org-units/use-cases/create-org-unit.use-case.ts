import { Inject, Injectable } from '@nestjs/common';
import { OrgUnit } from '../../../domain/org-units/org-unit.entity';
import { ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { orgUnitErrors } from '../errors';
import { toOrgUnitDto } from '../mappers/org-unit.mapper';
import { validateInput } from '../validation/validate-input';
import { CreateOrgUnitInput } from '../dto/create-org-unit.input';

@Injectable()
export class CreateOrgUnitUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: CreateOrgUnitInput) {
        const command = validateInput(CreateOrgUnitInput, input);
        const name = command.name?.trim();
        if (!name) {
            throw orgUnitErrors.validation({ name: 'Name is required.' });
        }

        let parent: OrgUnit | null = null;
        if (command.parentId) {
            parent = await this.orgUnitRepository.findById(command.parentId, command.tenantId);
            if (!parent) {
                throw orgUnitErrors.notFound('Parent org unit not found', { parentId: command.parentId });
            }
            if (parent.status !== 'active') {
                throw orgUnitErrors.validation({ parentId: 'Parent org unit must be active.' });
            }
            if (parent.path.includes(parent.id)) {
                throw orgUnitErrors.validation({ parentId: 'Parent org unit path is invalid.' });
            }
        }

        const path = parent ? [...parent.path, parent.id] : [];
        const unit = OrgUnit.create({
            tenantId: command.tenantId,
            name,
            code: command.code ?? null,
            type: command.type,
            status: command.status ?? 'active',
            parentId: parent?.id ?? null,
            path,
            depth: path.length,
            sortOrder: command.sortOrder ?? 0,
            createdBy: command.actorUserId ?? null,
            updatedBy: command.actorUserId ?? null,
        });

        const created = await this.orgUnitRepository.create(unit);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitCreated',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: created.id,
            targetNameSnapshot: created.name,
            after: {
                id: created.id,
                name: created.name,
                parentId: created.parentId,
                type: created.type,
                status: created.status,
                path: created.path,
            },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return toOrgUnitDto(created);
    }
}
