import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IRefreshTokenRepository } from '../../../domain/ports/out/refresh-token-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { TokenService } from './token.service';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';

export interface RefreshTokenResult {
    access_token: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    tenantSlug: string | null;
    isHost: boolean;
    user: {
        id: string;
        tenantId: string | null;
        email: string;
        name: string;
        roleId: string | null;
        roleIds: string[];
        role: any;
    };
}

@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        private readonly tokenService: TokenService,
    ) { }

    async execute(refreshToken: string | undefined | null): Promise<RefreshTokenResult> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        const tokenHash = this.tokenService.hashToken(refreshToken);
        const stored = await this.refreshTokenRepository.findByHash(tokenHash);
        if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
            throw new UnauthorizedException('Refresh token invalid or expired');
        }

        const user = await this.userRepository.findById(stored.userId);
        if (!user) {
            throw new UnauthorizedException('User not found for refresh token');
        }

        const isHostUser = user.role?.name === SYSTEM_ROLE_NAMES.HOST_ADMIN || !user.tenantId;

        // Fetch tenant to get the slug (tenant users only)
        let tenantSlug: string | null = null;
        if (!isHostUser) {
            const tenant = await this.tenantRepository.findById(user.tenantId);
            if (!tenant) {
                throw new UnauthorizedException('Tenant not found');
            }
            tenantSlug = tenant.subdomain;
        }

        await this.refreshTokenRepository.revokeById(stored.id);

        const access_token = this.tokenService.createAccessToken(user, { isHost: isHostUser });
        const refresh = this.tokenService.createRefreshToken();
        await this.refreshTokenRepository.create(user.id, refresh.tokenHash, refresh.expiresAt);

        return {
            access_token,
            refreshToken: refresh.token,
            refreshTokenExpiresAt: refresh.expiresAt,
            tenantSlug,
            isHost: isHostUser,
            user: this.tokenService.buildUserResponse(user)
        };
    }
}
