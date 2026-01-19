import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { validateInput } from '../validation/validate-input';
import { GetOrgUnitTreeInput } from '../dto/get-org-unit-tree.input';
import { toOrgUnitTreeItemDto } from '../mappers/org-unit.mapper';

@Injectable()
export class GetOrgUnitTreeUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
    ) { }

    async execute(input: GetOrgUnitTreeInput) {
        const command = validateInput(GetOrgUnitTreeInput, input);
        const units = await this.orgUnitRepository.findAll(command.tenantId, command.status);
        const childCounts = new Map<string, number>();
        units.forEach(unit => {
            if (unit.parentId) {
                childCounts.set(unit.parentId, (childCounts.get(unit.parentId) ?? 0) + 1);
            }
        });
        return units.map(unit => toOrgUnitTreeItemDto(unit, childCounts.get(unit.id) ?? 0));
    }
}
