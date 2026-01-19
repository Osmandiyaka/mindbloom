import { Inject, Injectable } from '@nestjs/common';
import {
    ORG_UNIT_MEMBER_REPOSITORY,
    ORG_UNIT_REPOSITORY,
    USER_REPOSITORY,
} from '../../../domain/ports/out/repository.tokens';
import { IOrgUnitMemberRepository } from '../../../domain/ports/out/org-unit-member-repository.port';
import { IOrgUnitRepository } from '../../../domain/ports/out/org-unit-repository.port';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { AuditService } from '../../services/audit/audit.service';
import { validateInput } from '../validation/validate-input';
import { AddOrgUnitMembersInput } from '../dto/add-org-unit-members.input';
import { orgUnitErrors } from '../errors';

@Injectable()
export class AddOrgUnitMembersUseCase {
    constructor(
        @Inject(ORG_UNIT_REPOSITORY)
        private readonly orgUnitRepository: IOrgUnitRepository,
        @Inject(ORG_UNIT_MEMBER_REPOSITORY)
        private readonly orgUnitMemberRepository: IOrgUnitMemberRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: AddOrgUnitMembersInput) {
        const command = validateInput(AddOrgUnitMembersInput, input);
        const unit = await this.orgUnitRepository.findById(command.orgUnitId, command.tenantId);
        if (!unit) {
            throw orgUnitErrors.notFound('Org unit not found', { orgUnitId: command.orgUnitId });
        }

        const userIds = Array.from(new Set(command.userIds.map(id => id.trim()).filter(Boolean)));
        if (!userIds.length) {
            throw orgUnitErrors.validation({ userIds: 'At least one userId is required.' });
        }

        const users = await Promise.all(userIds.map(id => this.userRepository.findById(id)));
        const missing = users.map((user, index) => (user && user.tenantId === command.tenantId ? null : userIds[index]))
            .filter(Boolean);
        if (missing.length) {
            throw orgUnitErrors.validation({ missingUserIds: missing });
        }

        await this.orgUnitMemberRepository.addMembers(command.tenantId, command.orgUnitId, userIds, command.actorUserId ?? null);

        await this.audit.log({
            category: 'ORG_UNIT',
            action: 'OrgUnitMembersAdded',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            actorUserId: command.actorUserId ?? undefined,
            targetType: 'OrgUnit',
            targetId: unit.id,
            targetNameSnapshot: unit.name,
            after: { userIds },
            result: 'SUCCESS',
            severity: 'INFO',
        });

        return { success: true };
    }
}
