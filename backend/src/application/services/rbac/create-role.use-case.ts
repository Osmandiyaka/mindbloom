import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { Permission } from '../../../domain/rbac/entities/permission.entity';
import {
    IRoleRepository,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/role-repository.port';

export interface CreateRoleDto {
    tenantId: string;
    name: string;
    description: string;
    permissions: Array<{
        resource: string;
        actions: string[];
        scope: string;
    }>;
}

@Injectable()
export class CreateRoleUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(dto: CreateRoleDto): Promise<Role> {
        if ((dto as any).isGlobal) {
            throw new Error('Creating global roles via tenant endpoint is not allowed');
        }

        // Check if role already exists
        const exists = await this.roleRepository.exists(dto.name, dto.tenantId);
        if (exists) {
            throw new Error(`Role with name "${dto.name}" already exists`);
        }

        // Convert DTO permissions to domain permissions
        const permissions = dto.permissions.map(
            (p) =>
                new Permission({
                    resource: p.resource,
                    actions: p.actions as any[],
                    scope: p.scope as any,
                }),
        );

        // Create role
        const role = Role.create({
            tenantId: dto.tenantId,
            name: dto.name,
            description: dto.description,
            permissions,
            isSystemRole: false, // Custom roles are never system roles
        });

        return this.roleRepository.create(role);
    }
}
