import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { userErrors } from '../errors';
import { validateInput } from '../validation/validate-input';
import { GetUserInput } from './dto/get-user.input';
import { toUserDto } from '../mappers/user.mapper';

@Injectable()
export class GetUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: GetUserInput) {
        const command = validateInput(GetUserInput, input);
        const user = await this.userRepository.findById(command.userId);
        if (!user || user.tenantId !== command.tenantId) {
            throw userErrors.notFound('User not found', { userId: command.userId });
        }
        return toUserDto(user);
    }
}
