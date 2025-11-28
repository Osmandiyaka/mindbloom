import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { GetPermissionTreeUseCase } from './get-permission-tree.use-case';

/**
 * Use Case: Add Permissions to User
 * Adds one or more permissions directly to a user
 */
@Injectable()
export class AddPermissionsToUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly getPermissionTree: GetPermissionTreeUseCase,
    ) { }

    async execute(userId: string, permissionIds: string[]) {
        // Get the user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Get permission objects from IDs
        const permissionsToAdd = permissionIds
            .map(id => this.getPermissionTree.findPermissionById(id))
            .filter(p => p !== undefined);

        if (permissionsToAdd.length === 0) {
            throw new Error('No valid permissions provided');
        }

        // Add permissions to user
        let updatedUser = user;
        for (const permission of permissionsToAdd) {
            updatedUser = updatedUser.addPermission(permission);
        }

        // Save updated user
        return this.userRepository.update(updatedUser);
    }
}
