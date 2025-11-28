import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/rbac/entities/role.entity';
import {
    IRoleRepository,
    ROLE_REPOSITORY,
} from '../../../domain/ports/out/role-repository.port';

@Injectable()
export class InitializeSystemRolesUseCase {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(tenantId: string): Promise<Role[]> {
        return this.roleRepository.initializeSystemRoles(tenantId);
    }
}
