import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';
import { User } from '../../../domain/user/entities/user.entity';

export interface UpdateUserCommand {
    userId: string;
    email?: string;
    name?: string;
    roleId?: string;
}

@Injectable()
export class UpdateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: UpdateUserCommand): Promise<User> {
        // Find user
        const user = await this.userRepository.findById(command.userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${command.userId} not found`);
        }

        // Create updated user (User entity is immutable)
        const updatedUser = User.create({
            id: user.id,
            tenantId: user.tenantId,
            email: command.email !== undefined ? command.email : user.email,
            name: command.name !== undefined ? command.name : user.name,
            roleId: command.roleId !== undefined ? command.roleId : user.roleId,
            role: user.role,
            permissions: user.permissions,
        });

        // Save user
        return await this.userRepository.update(updatedUser);
    }
}
