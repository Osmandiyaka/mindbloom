import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { User } from '../../../domain/user/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';

export interface RegisterCommand {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role?: string;
}

@Injectable()
export class RegisterUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: RegisterCommand): Promise<User> {
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
            role: command.role || 'user',
        });

        return await this.userRepository.create(user, command.password);
    }
}
