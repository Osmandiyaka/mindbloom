import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { IRefreshTokenRepository } from '../../../domain/ports/out/refresh-token-repository.port';
import { REFRESH_TOKEN_REPOSITORY, TENANT_REPOSITORY, USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { TokenService } from './token.service';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';
import { LoginResult } from './login.use-case';
import { User } from '../../../domain/entities/user.entity';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';

export interface ImpersonationRequest {
    tenantId: string;
    userId?: string;
    impersonatorUserId: string;
    impersonatorEmail?: string | null;
    reason?: string | null;
}

export interface ImpersonationResult extends LoginResult {
    memberships: Array<{
        tenantId: string;
        tenantSlug: string;
        tenantName: string;
        roles: string[];
        permissions?: string[];
    }>;
    activeTenantId: string;
    expiresAt: string;
    issuedAt: string;
    impersonatedBy: {
        userId: string;
        email?: string | null;
        reason?: string | null;
    };
}

@Injectable()
export class ImpersonateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        private readonly tokenService: TokenService,
    ) { }

    async execute(request: ImpersonationRequest): Promise<ImpersonationResult> {
        const tenant = await this.tenantRepository.findById(request.tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        const targetUser = request.userId
            ? await this.getUserById(request.userId, request.tenantId)
            : await this.pickDefaultTenantUser(request.tenantId);

        if (!targetUser.tenantId || targetUser.tenantId !== tenant.id) {
            throw new UnauthorizedException('User does not belong to tenant');
        }

        const access_token = this.tokenService.createAccessToken(targetUser, {
            isHost: false,
            impersonatorId: request.impersonatorUserId,
            impersonatorEmail: request.impersonatorEmail ?? null,
            impersonationReason: request.reason ?? null,
        });
        const refresh = this.tokenService.createRefreshToken();
        await this.refreshTokenRepository.create(targetUser.id, refresh.tokenHash, refresh.expiresAt);

        const expiresAt = this.tokenService.decodeExpiry(access_token) ?? new Date(Date.now() + 15 * 60 * 1000);
        const issuedAt = new Date();

        const membership = this.toMembership(targetUser, tenant);

        return {
            access_token,
            refreshToken: refresh.token,
            refreshTokenExpiresAt: refresh.expiresAt,
            tenantSlug: tenant.subdomain,
            isHost: false,
            user: this.toUserResponse(targetUser),
            memberships: [membership],
            activeTenantId: tenant.id,
            expiresAt: expiresAt.toISOString(),
            issuedAt: issuedAt.toISOString(),
            impersonatedBy: {
                userId: request.impersonatorUserId,
                email: request.impersonatorEmail ?? null,
                reason: request.reason ?? null,
            },
        };
    }

    private async getUserById(userId: string, tenantId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.tenantId) {
            throw new NotFoundException('User not found');
        }
        if (user.tenantId !== tenantId) {
            throw new UnauthorizedException('User does not belong to tenant');
        }
        return user;
    }

    private async pickDefaultTenantUser(tenantId: string): Promise<User> {
        const users = await this.userRepository.findAll(tenantId);
        if (!users.length) {
            throw new NotFoundException('No users found for tenant');
        }

        const byRole = (roleName: string) => users.find(u => (u.role?.name || '').toLowerCase() === roleName.toLowerCase());

        return byRole(SYSTEM_ROLE_NAMES.TENANT_ADMIN)
            || byRole(SYSTEM_ROLE_NAMES.PRINCIPAL)
            || users[0];
    }

    private toUserResponse(user: User): LoginResult['user'] {
        return {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            roleIds: user.roleIds,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
                isSystemRole: user.role.isSystemRole,
                permissions: user.role.permissions.map(p => ({
                    id: p.id,
                    resource: p.resource,
                    displayName: p.displayName,
                    description: p.description,
                    actions: p.actions,
                    scope: p.scope,
                })),
            } : null,
        };
    }

    private toMembership(user: User, tenant: Tenant) {
        const roleNames = user.roles.length
            ? user.roles.map(role => role.name)
            : [user.role?.name ?? 'User'];
        return {
            tenantId: tenant.id,
            tenantSlug: tenant.subdomain,
            tenantName: tenant.name,
            roles: roleNames,
            permissions: user.roles.length
                ? user.roles.flatMap(role => role.permissions.map(p => p.displayName || p.resource))
                : user.role?.permissions?.map(p => p.displayName || p.resource) ?? [],
        };
    }
}
