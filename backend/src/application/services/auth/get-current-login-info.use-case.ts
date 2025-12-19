import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { USER_REPOSITORY, TENANT_REPOSITORY, ROLE_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { Permission, PermissionAction } from '../../../domain/rbac/entities/permission.entity';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { User } from '../../../domain/entities/user.entity';

export interface CurrentLoginInfoResult {
    user: User;
    tenant: Tenant;
    roles: Role[];
    edition: ReturnType<typeof Tenant.editionSnapshot>;
    permissions: {
        direct: Permission[];
        role: Permission[];
        effective: Permission[];
        keys: string[];
    };
}

@Injectable()
export class GetCurrentLoginInfoUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(userId: string, tenantId: string): Promise<CurrentLoginInfoResult> {
        const user = await this.userRepository.findById(userId);

        if (!user || user.tenantId !== tenantId) {
            throw new UnauthorizedException('User not found for tenant');
        }

        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        const roles = await this.roleRepository.findAll(tenantId);
        const edition = Tenant.editionSnapshot(tenant);
        const rolePermissions = user.role?.permissions ?? [];
        const directPermissions = user.permissions ?? [];
        const effectivePermissions = [...rolePermissions, ...directPermissions];

        return {
            user,
            tenant,
            roles,
            edition,
            permissions: {
                direct: directPermissions,
                role: rolePermissions,
                effective: effectivePermissions,
                keys: this.toPermissionKeys(effectivePermissions),
            },
        };
    }

    private toPermissionKeys(permissions: Permission[]): string[] {
        const keys = new Set<string>();

        for (const permission of permissions) {
            const resource = (permission.resource || '').replace(/:/g, '.').toLowerCase();
            if (!resource) continue;

            const actions = permission.actions || [];
            if (!actions.length) {
                keys.add(resource);
                continue;
            }

            for (const action of actions) {
                const normalized = `${resource}.${String(action).toLowerCase()}`;
                keys.add(normalized);

                if (action === PermissionAction.MANAGE) {
                    keys.add(`${resource}.*`);
                }
            }
        }

        return Array.from(keys);
    }
}
