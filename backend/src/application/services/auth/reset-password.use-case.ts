import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(token: string, password: string, tenantId?: string): Promise<void> {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const user = await this.userRepository.findByResetToken(tokenHash);

        if (!user || (tenantId && user.tenantId !== tenantId)) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        await this.userRepository.updatePassword(user.id, password);
    }
}
