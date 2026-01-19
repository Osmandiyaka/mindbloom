import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { classesSectionsErrors } from '../errors';
import { ArchiveSectionInput } from '../dto/section.inputs';
import { validateInput } from '../validation/validate-input';
import { archiveSchema } from '../validation/schemas';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';

@Injectable()
export class ArchiveSectionUseCase {
    constructor(
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: ArchiveSectionInput) {
        const command = validateInput(archiveSchema, {
            tenantId: input.tenantId,
            id: input.sectionId,
            confirmationText: input.confirmationText,
            actorUserId: input.actorUserId,
        });
        const section = await this.sectionRepository.findById(command.tenantId, command.id);
        if (!section) {
            throw classesSectionsErrors.notFound('Section not found.');
        }

        await this.sectionRepository.archive(command.tenantId, section.id, command.actorUserId);
        await this.audit.log({
            category: 'sections',
            action: 'archive',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'section',
            targetId: section.id,
            targetNameSnapshot: section.name,
            before: section.toPrimitives(),
            after: { ...section.toPrimitives(), status: 'archived' },
            result: 'SUCCESS',
        });

        return { sectionId: section.id };
    }
}
