import { Inject, Injectable } from '@nestjs/common';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { classesSectionsErrors } from '../errors';

@Injectable()
export class GetGradeUseCase {
    constructor(@Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository) {}

    async execute(tenantId: string, gradeId: string) {
        const grade = await this.gradeRepository.findById(tenantId, gradeId);
        if (!grade) {
            throw classesSectionsErrors.notFound('Grade not found.');
        }
        return grade.toPrimitives();
    }
}
