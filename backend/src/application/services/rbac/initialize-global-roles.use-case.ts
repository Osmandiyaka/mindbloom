import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { IRoleRepository, ROLE_REPOSITORY } from '../../../domain/ports/out/role-repository.port';

/**
 * Ensures global roles (tenant-agnostic) exist. Safe to call repeatedly.
 */
@Injectable()
export class InitializeGlobalRolesUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(): Promise<Role[]> {
        return this.roleRepository.initializeGlobalRoles();
    }
}
