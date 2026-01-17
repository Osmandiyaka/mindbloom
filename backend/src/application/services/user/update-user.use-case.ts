import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { User } from '../../../domain/entities/user.entity';
import { UpdateUserCommand } from '../../ports/in/commands/update-user.command';

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
            profilePicture: command.profilePicture !== undefined ? command.profilePicture : user.profilePicture,
            gender: command.gender !== undefined ? command.gender : user.gender,
            dateOfBirth: command.dateOfBirth !== undefined ? command.dateOfBirth : user.dateOfBirth,
            phone: command.phone !== undefined ? command.phone : user.phone,
            forcePasswordReset: command.forcePasswordReset !== undefined ? command.forcePasswordReset : user.forcePasswordReset,
            mfaEnabled: command.mfaEnabled !== undefined ? command.mfaEnabled : user.mfaEnabled,
        });

        // Save user
        return await this.userRepository.update(updatedUser);
    }
}
