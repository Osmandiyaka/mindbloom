import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { USER_REPOSITORY, TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { Permission, PermissionAction } from '../../../domain/rbac/entities/permission.entity';
import { User } from '../../../domain/entities/user.entity';

export interface CurrentLoginInfoResult {
    user: User;
    tenant: Tenant;
    edition: ReturnType<typeof Tenant.editionSnapshot>;
    permissions: string[];
}

@Injectable()
export class GetCurrentLoginInfoUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
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

        const edition = Tenant.editionSnapshot(tenant);
        const rolePermissions = user.role?.permissions ?? [];
        const directPermissions = user.permissions ?? [];
        const effectivePermissions = [...rolePermissions, ...directPermissions];
        const permissionKeys = this.toPermissionKeys(effectivePermissions);


        return {
            user,
            tenant,
            edition,
            permissions: permissionKeys,
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
