import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { classesSectionsErrors } from '../errors';
import { RestoreClassInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { restoreSchema } from '../validation/schemas';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';

@Injectable()
export class RestoreClassUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: RestoreClassInput) {
        const command = validateInput(restoreSchema, {
            tenantId: input.tenantId,
            id: input.classId,
            actorUserId: input.actorUserId,
        });
        const classEntity = await this.classRepository.findById(command.tenantId, command.id);
        if (!classEntity) {
            throw classesSectionsErrors.notFound('Class not found.');
        }

        await this.classRepository.restore(command.tenantId, classEntity.id, command.actorUserId);
        await this.sectionRepository.restoreByClassId(command.tenantId, classEntity.id);

        await this.audit.log({
            category: 'classes',
            action: 'restore',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'class',
            targetId: classEntity.id,
            targetNameSnapshot: classEntity.name,
            before: classEntity.toPrimitives(),
            after: { ...classEntity.toPrimitives(), status: 'active' },
            result: 'SUCCESS',
        });

        return { classId: classEntity.id };
    }
}
