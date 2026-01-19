import { Inject, Injectable } from '@nestjs/common';
import {
    ORG_UNIT_MEMBER_REPOSITORY,
    ORG_UNIT_REPOSITORY,
    ORG_UNIT_ROLE_REPOSITORY,
} from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IOrgUnitMemberRepository } from '../../../domain/ports/out/org-unit-member-repository.port';
import { IOrgUnitRoleRepository } from '../../../domain/ports/out/org-unit-role-repository.port';
import { validateInput } from '../validation/validate-input';
import { GetOrgUnitInput } from '../dto/get-org-unit.input';
import { orgUnitErrors } from '../errors';
import { OrgUnitBreadcrumbDto, toOrgUnitDetailDto } from '../mappers/org-unit.mapper';

@Injectable()
export class GetOrgUnitUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
    ) { }

    async execute(input: GetOrgUnitInput) {
        const command = validateInput(GetOrgUnitInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const ancestors = unit.path.length
            ? await this.orgUnitRepository.findByIds(unit.path, command.tenantId)
            : [];
        const ancestorMap = new Map(ancestors.map(item => [item.id, item]));
        const breadcrumb: OrgUnitBreadcrumbDto[] = unit.path.map(id => {
            const item = ancestorMap.get(id);
            return { id, name: item?.name ?? '' };
        }).filter(item => item.name);

        const descendants = await this.orgUnitRepository.findDescendants(command.tenantId, unit.id);
        const childCount = descendants.filter(item => item.parentId === unit.id).length;
        const membersCount = await this.orgUnitMemberRepository.countMembers(command.tenantId, [unit.id]);
        const rolesCount = await this.orgUnitRoleRepository.countAssignments(command.tenantId, [unit.id]);

        return toOrgUnitDetailDto(unit, breadcrumb, childCount, membersCount, rolesCount);
    }
}
