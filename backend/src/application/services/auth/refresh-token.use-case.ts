import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IRefreshTokenRepository } from '../../../domain/ports/out/refresh-token-repository.port';
import { TokenService } from './token.service';

export interface RefreshTokenResult {
    access_token: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    user: {
        id: string;
        tenantId: string;
        email: string;
        name: string;
        roleId: string | null;
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

        await this.refreshTokenRepository.revokeById(stored.id);

        const access_token = this.tokenService.createAccessToken(user);
        const refresh = this.tokenService.createRefreshToken();
        await this.refreshTokenRepository.create(user.id, refresh.tokenHash, refresh.expiresAt);

        return {
            access_token,
            refreshToken: refresh.token,
            refreshTokenExpiresAt: refresh.expiresAt,
            user: this.tokenService.buildUserResponse(user)
        };
    }
}
