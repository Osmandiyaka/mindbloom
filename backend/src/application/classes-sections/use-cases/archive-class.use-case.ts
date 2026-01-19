import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { classesSectionsErrors } from '../errors';
import { ArchiveClassInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { archiveSchema } from '../validation/schemas';
import { CLASS_REPOSITORY, IClassRepository, IClassReadModelPort, CLASS_READ_MODEL } from '../../../domain/ports/out/class-repository.port';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';
import { assertConfirmationText } from './shared';

@Injectable()
export class ArchiveClassUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(CLASS_READ_MODEL) private readonly classReadModel: IClassReadModelPort,
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: ArchiveClassInput) {
        const command = validateInput(archiveSchema, {
            tenantId: input.tenantId,
            id: input.classId,
            confirmationText: input.confirmationText,
            actorUserId: input.actorUserId,
        });
        const classEntity = await this.classRepository.findById(command.tenantId, command.id);
        if (!classEntity) {
            throw classesSectionsErrors.notFound('Class not found.');
        }

        const sectionsCount = await this.classReadModel.countSectionsByClass(command.tenantId, classEntity.id);
        if (sectionsCount > 0) {
            assertConfirmationText(classEntity.name, command.confirmationText);
        }

        await this.classRepository.archive(command.tenantId, classEntity.id, command.actorUserId);
        if (sectionsCount > 0) {
            await this.sectionRepository.archiveByClassId(command.tenantId, classEntity.id);
        }

        await this.audit.log({
            category: 'classes',
            action: 'archive',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'class',
            targetId: classEntity.id,
            targetNameSnapshot: classEntity.name,
            before: classEntity.toPrimitives(),
            after: { ...classEntity.toPrimitives(), status: 'archived' },
            result: 'SUCCESS',
        });

        return { classId: classEntity.id, sectionsCount };
    }
}
