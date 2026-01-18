import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { USER_REPOSITORY, TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { Permission, PermissionAction } from '../../../domain/rbac/entities/permission.entity';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';
import { User } from '../../../domain/entities/user.entity';
import { ROLE_REPOSITORY, IRoleRepository } from '../../../domain/ports/out/role-repository.port';
import { Role } from '../../../domain/rbac/entities/role.entity';
import { getCanonicalEditionByCode } from '../../../domain/edition/entities/canonical-editions';

export interface CurrentLoginInfoResult {
    user: User;
    tenant: Tenant;
    edition: { editionCode: string; editionName: string; features: string[]; modules: string[] } | null;
    requiresEditionSelection: boolean;
    permissions: string[];
    roles: Role[];
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

        const editionFromId = tenant.editionId ? getCanonicalEditionByCode(tenant.editionId) : null;
        const editionFromMetadata = tenant.metadata?.editionCode
            ? getCanonicalEditionByCode(String(tenant.metadata.editionCode))
            : null;
        const canonical = editionFromId ?? editionFromMetadata;
        const requiresEditionSelection = !canonical;
        const edition = canonical
            ? {
                editionCode: canonical.code,
                editionName: canonical.displayName,
                features: canonical.features,
                modules: canonical.modules,
            }
            : null;
        const rolePermissions = user.roles.length
            ? user.roles.flatMap(role => role.permissions)
            : user.role?.permissions ?? [];
        const directPermissions = user.permissions ?? [];
        const effectivePermissions = [...rolePermissions, ...directPermissions];
        let permissionKeys = this.toPermissionKeys(effectivePermissions);

        // Guarantee full access for Tenant Admin/Host Admin even if stored role lacks wildcard permissions
        const hasAdminRole = user.roles.some(role =>
            role.name === SYSTEM_ROLE_NAMES.TENANT_ADMIN || role.name === SYSTEM_ROLE_NAMES.HOST_ADMIN
        ) || user.role?.name === SYSTEM_ROLE_NAMES.TENANT_ADMIN || user.role?.name === SYSTEM_ROLE_NAMES.HOST_ADMIN;
        if (hasAdminRole) {
            permissionKeys = ['*', '*.*'];
        }


        const roles = await this.roleRepository.findAll(tenantId);

        return {
            user,
            tenant,
            edition,
            requiresEditionSelection,
            permissions: permissionKeys,
            roles,
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
