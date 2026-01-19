import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { classesSectionsErrors } from '../errors';
import { RestoreSectionInput } from '../dto/section.inputs';
import { validateInput } from '../validation/validate-input';
import { restoreSchema } from '../validation/schemas';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';

@Injectable()
export class RestoreSectionUseCase {
    constructor(
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: RestoreSectionInput) {
        const command = validateInput(restoreSchema, {
            tenantId: input.tenantId,
            id: input.sectionId,
            actorUserId: input.actorUserId,
        });
        const section = await this.sectionRepository.findById(command.tenantId, command.id);
        if (!section) {
            throw classesSectionsErrors.notFound('Section not found.');
        }

        await this.sectionRepository.restore(command.tenantId, section.id, command.actorUserId);
        await this.audit.log({
            category: 'sections',
            action: 'restore',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'section',
            targetId: section.id,
            targetNameSnapshot: section.name,
            before: section.toPrimitives(),
            after: { ...section.toPrimitives(), status: 'active' },
            result: 'SUCCESS',
        });

        return { sectionId: section.id };
    }
}
