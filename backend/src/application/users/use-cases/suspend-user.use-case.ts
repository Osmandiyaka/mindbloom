import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { AuditService } from '../../services/audit/audit.service';
import { userErrors } from '../errors';
import { validateInput } from '../validation/validate-input';
import { StatusChangeInput } from './dto/status-change.input';
import { toUserDto } from '../mappers/user.mapper';

@Injectable()
export class SuspendUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(input: StatusChangeInput) {
        const command = validateInput(StatusChangeInput, input);
        const user = await this.userRepository.findById(command.userId);
        if (!user || user.tenantId !== command.tenantId) {
            throw userErrors.notFound('User not found', { userId: command.userId });
        }
        const updated = user.suspend();
        const saved = await this.userRepository.update(updated);
        await this.audit.log({
            category: 'USER',
            action: 'UserSuspended',
            scope: 'TENANT',
            tenantId: command.tenantId,
            actorType: 'TENANT_USER',
            targetType: 'User',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            after: { id: saved.id, status: saved.status },
            result: 'SUCCESS',
            severity: 'WARN',
        });
        return toUserDto(saved);
    }
}
