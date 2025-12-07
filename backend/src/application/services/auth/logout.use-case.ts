import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IRefreshTokenRepository } from '../../../domain/ports/out/refresh-token-repository.port';
import { TokenService } from './token.service';

@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        private readonly tokenService: TokenService,
    ) { }

    async execute(userId: string | undefined, refreshToken?: string | null): Promise<void> {
        if (refreshToken) {
            const tokenHash = this.tokenService.hashToken(refreshToken);
            await this.refreshTokenRepository.revokeByHash(tokenHash);
        }

        if (userId) {
            await this.refreshTokenRepository.revokeAllForUser(userId);
        }
    }
}
