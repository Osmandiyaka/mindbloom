import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { RegisterCommand } from '../../ports/in/commands/register.command';

@Injectable()
export class RegisterUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly config: ConfigService,
    ) { }

    async execute(command: RegisterCommand): Promise<User> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(command.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Create new user
        const defaults = {
            status: (this.config.get<string>('USER_DEFAULT_STATUS') ?? 'active') as any,
            schoolAccess: { scope: 'all' as const },
        };

        const user = User.create({
            tenantId: command.tenantId,
            email: command.email,
            name: command.name,
            roleIds: [],
            roles: [],
            status: defaults.status,
            schoolAccess: defaults.schoolAccess,
        });

        return await this.userRepository.create(user, command.password);
    }
}
