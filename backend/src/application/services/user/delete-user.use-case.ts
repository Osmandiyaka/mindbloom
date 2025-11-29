import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';

@Injectable()
export class DeleteUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string, tenantId: string): Promise<void> {
        await this.userRepository.delete(userId, tenantId);
    }
}
