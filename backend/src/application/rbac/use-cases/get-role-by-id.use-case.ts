import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/rbac/entities/role.entity';
import {
    IRoleRepository,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/role-repository.port';

@Injectable()
export class GetRoleByIdUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(id: string, tenantId: string): Promise<Role> {
        const role = await this.roleRepository.findById(id, tenantId);
        if (!role) {
            throw new Error(`Role with ID "${id}" not found`);
        }
        return role;
    }
}
