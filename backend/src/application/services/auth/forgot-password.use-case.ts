import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { PasswordResetMailer } from './password-reset.mailer';

@Injectable()
export class ForgotPasswordUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly mailer: PasswordResetMailer,
        private readonly configService: ConfigService,
    ) { }

    async execute(identifier: string, tenantId?: string): Promise<void> {
        const user = await this.userRepository.findByEmail(identifier);

        // Always respond success to avoid account enumeration
        if (!user || (tenantId && user.tenantId !== tenantId)) {
            return;
        }

        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await this.userRepository.setResetToken(user.id, tokenHash, expiresAt);

        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const resetLink = `${baseUrl.replace(/\/$/, '')}/auth/reset/${token}`;

        await this.mailer.sendResetEmail(user.email, user.name, resetLink, expiresAt);
    }
}
