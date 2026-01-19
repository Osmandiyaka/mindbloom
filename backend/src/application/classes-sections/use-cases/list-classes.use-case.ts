import { Inject, Injectable } from '@nestjs/common';
import { CLASS_REPOSITORY, IClassRepository, IClassReadModelPort, CLASS_READ_MODEL } from '../../../domain/ports/out/class-repository.port';
import { ListClassesInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { listClassesSchema } from '../validation/schemas';

@Injectable()
export class ListClassesUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(CLASS_READ_MODEL) private readonly classReadModel: IClassReadModelPort,
    ) {}

    async execute(input: ListClassesInput) {
        const command = validateInput(listClassesSchema, input);
        const pagination = {
            page: command.page ?? 1,
            pageSize: command.pageSize ?? 25,
        };
        const filters = {
            schoolId: command.schoolId,
            academicYearId: command.academicYearId,
            gradeId: command.gradeId,
            status: command.status,
            search: command.search,
        };

        if (command.includeCounts) {
            const result = await this.classReadModel.listWithCounts(
                command.tenantId,
                filters,
                pagination,
                { field: 'sortOrder', direction: 'asc' },
            );
            return {
                ...result,
                items: result.items.map(item => ({ ...item.toPrimitives(), sectionsCount: (item as any).sectionsCount ?? 0 })),
            };
        }
        const result = await this.classRepository.list(command.tenantId, filters, pagination, { field: 'sortOrder', direction: 'asc' });
        return { ...result, items: result.items.map(item => item.toPrimitives()) };
    }
}
