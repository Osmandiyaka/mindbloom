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
import { DeleteOrgUnitImpactInput } from '../dto/delete-org-unit-impact.input';
import { orgUnitErrors } from '../errors';
import { OrgUnitDeleteImpactDto, toOrgUnitDeleteImpactDto } from '../mappers/org-unit.mapper';

@Injectable()
export class DeleteOrgUnitImpactUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
    ) { }

    async execute(input: DeleteOrgUnitImpactInput) {
        const command = validateInput(DeleteOrgUnitImpactInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const descendants = await this.orgUnitRepository.findDescendants(command.tenantId, unit.id);
        const descendantIds = descendants.map(item => item.id);
        const membersDirectCount = await this.orgUnitMemberRepository.countMembers(command.tenantId, [unit.id]);
        const membersInheritedCount = await this.orgUnitMemberRepository.countMembers(command.tenantId, descendantIds);
        const roleAssignmentsCount = await this.orgUnitRoleRepository.countAssignments(command.tenantId, [unit.id]);
        const rolesInheritedImpactCount = await this.orgUnitRoleRepository.countAssignments(command.tenantId, descendantIds);

        const previewNames = [unit.name, ...descendants.map(item => item.name)]
            .filter(Boolean)
            .slice(0, 10);

        const impact: OrgUnitDeleteImpactDto = {
            descendantUnitsCount: descendants.length,
            membersDirectCount,
            membersInheritedCount,
            roleAssignmentsCount,
            rolesInheritedImpactCount,
            willDeleteUnitNamesPreview: previewNames,
        };

        return toOrgUnitDeleteImpactDto(impact);
    }
}
