import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY } from '../../../domain/ports/out/role-repository.port';
import { GetPermissionTreeUseCase } from './get-permission-tree.use-case';

/**
 * Use Case: Add Permissions to Role
 * Adds one or more permissions to an existing role
 */
@Injectable()
export class AddPermissionsToRoleUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
        private readonly getPermissionTree: GetPermissionTreeUseCase,
    ) { }

    async execute(roleId: string, permissionIds: string[], tenantId: string) {
        // Get the role
        const role = await this.roleRepository.findById(roleId, tenantId);
        if (!role) {
            throw new Error(`Role with ID ${roleId} not found`);
        }

        // Validate that role can be modified
        role.validateModifiable();

        // Get permission objects from IDs
        const permissionsToAdd = permissionIds
            .map(id => this.getPermissionTree.findPermissionById(id))
            .filter(p => p !== undefined);

        if (permissionsToAdd.length === 0) {
            throw new Error('No valid permissions provided');
        }

        // Add permissions to role
        for (const permission of permissionsToAdd) {
            role.addPermission(permission);
        }

        // Save updated role
        return this.roleRepository.update(role);
    }
}
