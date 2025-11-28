import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { Permission } from '../../../domain/rbac/entities/permission.entity';
import {
    IRoleRepository,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/role-repository.port';

export interface UpdateRoleDto {
    id: string;
    tenantId: string;
    name?: string;
    description?: string;
    permissions?: Array<{
        resource: string;
        actions: string[];
        scope: string;
    }>;
}

@Injectable()
export class UpdateRoleUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(dto: UpdateRoleDto): Promise<Role> {
        // Get existing role
        const role = await this.roleRepository.findById(dto.id, dto.tenantId);
        if (!role) {
            throw new Error(`Role with ID "${dto.id}" not found`);
        }

        // Validate can be modified
        role.validateModifiable();

        // Update fields
        if (dto.name) {
            role.name = dto.name;
        }

        if (dto.description) {
            role.description = dto.description;
        }

        if (dto.permissions) {
            role.permissions = dto.permissions.map(
                (p) =>
                    new Permission({
                        resource: p.resource,
                        actions: p.actions as any[],
                        scope: p.scope as any,
                    }),
            );
        }

        role.updatedAt = new Date();

        return this.roleRepository.update(role);
    }
}
