import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';
import { User } from '../../../domain/user/entities/user.entity';

export interface CreateUserCommand {
    tenantId: string;
    email: string;
    name: string;
    password: string;
    roleId?: string;
    profilePicture?: string;
}

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: CreateUserCommand): Promise<User> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(command.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Create new user
        const user = User.create({
            tenantId: command.tenantId,
            email: command.email,
            name: command.name,
            roleId: command.roleId || null,
            role: null, // Will be populated by repository
            profilePicture: command.profilePicture || null,
        });

        // Save user with password
        return await this.userRepository.create(user, command.password);
    }
}
