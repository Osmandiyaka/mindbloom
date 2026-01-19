import { Inject, Injectable } from '@nestjs/common';
import { classesSectionsErrors } from '../errors';
import { ArchiveGradeImpactInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { restoreSchema } from '../validation/schemas';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { CLASS_REPOSITORY, IClassRepository, IClassReadModelPort, CLASS_READ_MODEL } from '../../../domain/ports/out/class-repository.port';
import { hasOverlap } from '../utils';

@Injectable()
export class ArchiveGradeImpactUseCase {
    constructor(
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(CLASS_READ_MODEL) private readonly classReadModel: IClassReadModelPort,
    ) {}

    async execute(input: ArchiveGradeImpactInput) {
        const command = validateInput(restoreSchema, { tenantId: input.tenantId, id: input.gradeId });
        const grade = await this.gradeRepository.findById(command.tenantId, command.id);
        if (!grade) {
            throw classesSectionsErrors.notFound('Grade not found.');
        }

        const classes = await this.classRepository.listByGradeId(command.tenantId, grade.id, 'active');
        const impactedClasses = classes.filter(item => hasOverlap(item.schoolIds, grade.schoolIds));
        let sectionsCount = 0;
        for (const row of impactedClasses) {
            sectionsCount += await this.classReadModel.countSectionsByClass(command.tenantId, row.id);
        }

        return {
            gradeId: grade.id,
            classesCount: impactedClasses.length,
            sectionsCount,
        };
    }
}
