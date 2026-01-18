import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { User } from '../../../domain/entities/user.entity';
import { CreateUserCommand } from '../../ports/in/commands/create-user.command';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly config: ConfigService,
    ) { }

    async execute(command: CreateUserCommand): Promise<User> {
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
            roleIds: command.roleId ? [command.roleId] : [],
            roles: [],
            profilePicture: command.profilePicture || null,
            gender: command.gender || null,
            dateOfBirth: command.dateOfBirth || null,
            phone: command.phone || null,
            forcePasswordReset: command.forcePasswordReset ?? false,
            mfaEnabled: command.mfaEnabled ?? false,
            status: defaults.status,
            schoolAccess: defaults.schoolAccess,
        });

        // Save user with password
        return await this.userRepository.create(user, command.password);
    }
}
