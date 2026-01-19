import { Inject, Injectable } from '@nestjs/common';
import { ORG_UNIT_MEMBER_REPOSITORY, ORG_UNIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitMemberRepository } from '../../../domain/ports/out/org-unit-member-repository.port';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { validateInput } from '../validation/validate-input';
import { ListOrgUnitMembersInput } from '../dto/list-org-unit-members.input';
import { orgUnitErrors } from '../errors';
import { toOrgUnitMemberDto } from '../mappers/org-unit.mapper';

@Injectable()
export class ListOrgUnitMembersUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
    ) { }

    async execute(input: ListOrgUnitMembersInput) {
        const command = validateInput(ListOrgUnitMembersInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }
        const members = await this.orgUnitMemberRepository.listMembers(
            command.tenantId,
            command.orgUnitId,
            command.search,
            command.includeInherited ?? false,
        );
        return members.map(toOrgUnitMemberDto);
    }
}
