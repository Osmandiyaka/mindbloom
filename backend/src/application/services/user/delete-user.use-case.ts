import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeleteUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly audit: AuditService,
    ) { }

    async execute(userId: string, tenantId: string): Promise<void> {
        const existing = await this.userRepository.findById(userId);
        await this.userRepository.delete(userId, tenantId);
        await this.audit.log({
            category: 'USER',
            action: 'UserDeleted',
            scope: 'TENANT',
            tenantId,
            actorType: 'TENANT_USER',
            targetType: 'User',
            targetId: userId,
            targetNameSnapshot: existing?.name ?? null,
            before: existing ? { id: existing.id, email: existing.email, roleIds: existing.roleIds } : null,
            result: 'SUCCESS',
            severity: 'WARN',
        });
    }
}
