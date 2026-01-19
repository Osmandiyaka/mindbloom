import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { validateInput } from '../validation/validate-input';
import { ListOrgUnitsInput } from '../dto/list-org-units.input';
import { toOrgUnitDto } from '../mappers/org-unit.mapper';

@Injectable()
export class ListOrgUnitsUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
    ) { }

    async execute(input: ListOrgUnitsInput) {
        const command = validateInput(ListOrgUnitsInput, input);
        const result = await this.orgUnitRepository.list({
            tenantId: command.tenantId,
            parentId: command.parentId ?? undefined,
            status: command.status,
            search: command.search,
            limit: command.limit,
            cursor: command.cursor,
        });
        return {
            items: result.items.map(toOrgUnitDto),
            nextCursor: result.nextCursor ?? null,
        };
    }
}
