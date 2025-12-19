import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { REFRESH_TOKEN_REPOSITORY, USER_REPOSITORY, TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { MongooseUserRepository } from '../../../infrastructure/adapters/persistence/mongoose/user.repository';
import { LoginCommand } from '../../ports/in/commands/login.command';
import { IRefreshTokenRepository } from '../../../domain/ports/out/refresh-token-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { TokenService } from './token.service';

export interface LoginResult {
    access_token: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    tenantSlug: string;
    user: {
        id: string;
        tenantId: string;
        email: string;
        name: string;
        roleId: string | null;
        role: {
            id: string;
            name: string;
            description: string;
            isSystemRole: boolean;
            permissions: Array<{
                id: string;
                resource: string;
                displayName: string;
                description: string;
                actions: string[];
                scope: string;
            }>
        } | null;
    };
}

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository & MongooseUserRepository,
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        private readonly tokenService: TokenService,
    ) { }

    async execute(command: LoginCommand): Promise<LoginResult> {
        // Validate credentials
        const isValid = await this.userRepository.validatePassword(
            command.email,
            command.password,
        );

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = await this.userRepository.findByEmail(command.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Fetch tenant to get the slug
        const tenant = await this.tenantRepository.findById(user.tenantId);
        if (!tenant) {
            throw new UnauthorizedException('Tenant not found');
        }

        const access_token = this.tokenService.createAccessToken(user);
        const refresh = this.tokenService.createRefreshToken();
        await this.refreshTokenRepository.create(user.id, refresh.tokenHash, refresh.expiresAt);

        return {
            access_token,
            refreshToken: refresh.token,
            refreshTokenExpiresAt: refresh.expiresAt,
            tenantSlug: tenant.subdomain,
            user: {
                id: user.id,
                tenantId: user.tenantId,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
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
                        scope: p.scope
                    }))
                } : null,
            },
        };
    }
}
