import { Inject, Injectable } from '@nestjs/common';
import { SECTION_READ_MODEL, ISectionReadModelPort } from '../../../domain/ports/out/section-repository.port';
import { ListSectionsByClassInput } from '../dto/section.inputs';
import { validateInput } from '../validation/validate-input';
import { listSectionsByClassSchema } from '../validation/schemas';

@Injectable()
export class ListSectionsByClassUseCase {
    constructor(@Inject(SECTION_READ_MODEL) private readonly sectionReadModel: ISectionReadModelPort) {}

    async execute(input: ListSectionsByClassInput) {
        const command = validateInput(listSectionsByClassSchema, input);
        const result = await this.sectionReadModel.listByClass(
            command.tenantId,
            command.classId,
            {
                classId: command.classId,
                status: command.status,
                search: command.search,
            },
            {
                page: command.page ?? 1,
                pageSize: command.pageSize ?? 25,
            },
        );
        return { ...result, items: result.items.map(item => item.toPrimitives()) };
    }
}
