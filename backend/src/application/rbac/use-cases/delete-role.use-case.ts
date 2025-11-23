import { Inject, Injectable } from '@nestjs/common';
import {
    IRoleRepository,
    ROLE_REPOSITORY,
} from '../../../domain/rbac/ports/role.repository.interface';

@Injectable()
export class DeleteRoleUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(id: string, tenantId: string): Promise<void> {
        // Get role to validate it exists and can be deleted
        const role = await this.roleRepository.findById(id, tenantId);
        if (!role) {
            throw new Error(`Role with ID "${id}" not found`);
        }

        // Validate can be modified (system roles cannot be deleted)
        role.validateModifiable();

        // TODO: Check if role is assigned to any users
        // If yes, throw error or reassign users

        await this.roleRepository.delete(id, tenantId);
    }
}
