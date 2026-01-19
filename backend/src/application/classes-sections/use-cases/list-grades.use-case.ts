import { Inject, Injectable } from '@nestjs/common';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { ListGradesInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { listGradesSchema } from '../validation/schemas';

@Injectable()
export class ListGradesUseCase {
    constructor(@Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository) {}

    async execute(input: ListGradesInput) {
        const command = validateInput(listGradesSchema, input);
        return this.gradeRepository.list(
            command.tenantId,
            {
                schoolId: command.schoolId,
                status: command.status,
                search: command.search,
            },
            {
                page: command.page ?? 1,
                pageSize: command.pageSize ?? 25,
            },
        ).then(result => ({
            ...result,
            items: result.items.map(item => item.toPrimitives()),
        }));
    }
}
