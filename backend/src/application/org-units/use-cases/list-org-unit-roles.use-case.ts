import { Inject, Injectable } from '@nestjs/common';
import {
    ORG_UNIT_REPOSITORY,
    ORG_UNIT_ROLE_REPOSITORY,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IOrgUnitRoleRepository } from '../../../domain/ports/out/org-unit-role-repository.port';
import { IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { validateInput } from '../validation/validate-input';
import { ListOrgUnitRolesInput } from '../dto/list-org-unit-roles.input';
import { orgUnitErrors } from '../errors';
import { toOrgUnitRoleAssignmentDto } from '../mappers/org-unit.mapper';

@Injectable()
export class ListOrgUnitRolesUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_ROLE_REPOSITORY)
        private readonly orgUnitRoleRepository: IOrgUnitRoleRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(input: ListOrgUnitRolesInput) {
        const command = validateInput(ListOrgUnitRolesInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const assignments = await this.orgUnitRoleRepository.listRoles(
            command.tenantId,
            command.orgUnitId,
            command.includeInherited ?? false,
        );
        if (!assignments.length) return [];

        const uniqueRoleIds = Array.from(new Set(assignments.map(item => item.roleId)));
        const roles = await Promise.all(uniqueRoleIds.map(id => this.roleRepository.findById(id, command.tenantId)));
        const roleMap = new Map(uniqueRoleIds.map((id, index) => [id, roles[index] ?? null]));

        return assignments.map(record => toOrgUnitRoleAssignmentDto(record, roleMap.get(record.roleId) ?? null));
    }
}
