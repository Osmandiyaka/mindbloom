import { Inject, Injectable } from '@nestjs/common';
import { classesSectionsErrors } from '../errors';
import { ArchiveClassImpactInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { restoreSchema } from '../validation/schemas';
import { CLASS_REPOSITORY, IClassRepository, IClassReadModelPort, CLASS_READ_MODEL } from '../../../domain/ports/out/class-repository.port';

@Injectable()
export class ArchiveClassImpactUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(CLASS_READ_MODEL) private readonly classReadModel: IClassReadModelPort,
    ) {}

    async execute(input: ArchiveClassImpactInput) {
        const command = validateInput(restoreSchema, { tenantId: input.tenantId, id: input.classId });
        const classEntity = await this.classRepository.findById(command.tenantId, command.id);
        if (!classEntity) {
            throw classesSectionsErrors.notFound('Class not found.');
        }
        const sectionsCount = await this.classReadModel.countSectionsByClass(command.tenantId, classEntity.id);
        return {
            classId: classEntity.id,
            sectionsCount,
        };
    }
}
