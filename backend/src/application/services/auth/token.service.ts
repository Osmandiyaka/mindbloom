import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { User } from '../../../domain/entities/user.entity';

export interface TokenPairResult {
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
    refreshMaxAgeMs: number;
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    createAccessToken(user: User, options?: { isHost?: boolean; impersonatorId?: string | null; impersonatorEmail?: string | null; impersonationReason?: string | null }): string {
        const tenantId = options?.isHost ? null : (user.tenantId ?? null);

        const payload: Record<string, any> = {
            sub: user.id,
            tenantId,
            email: user.email,
            roleId: user.roleId,
            roleIds: user.roleIds,
            roleName: user.role?.name || null,
        };

        if (options?.impersonatorId) {
            payload.impersonated = true;
            payload.impersonatorId = options.impersonatorId;
            payload.impersonatorEmail = options.impersonatorEmail ?? null;
            payload.impersonationReason = options.impersonationReason ?? null;
        }

        return this.jwtService.sign(payload);
    }

    createRefreshToken(): { token: string; expiresAt: Date; tokenHash: string; maxAgeMs: number } {
        const refreshDaysRaw = this.configService.get('JWT_REFRESH_EXPIRES_IN_DAYS');
        const refreshDays = Number(refreshDaysRaw ?? 7);
        const validDays = Number.isFinite(refreshDays) ? refreshDays : 7;
        const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
        const token = randomBytes(48).toString('hex');
        return {
            token,
            expiresAt,
            tokenHash: this.hashToken(token),
            maxAgeMs: expiresAt.getTime() - Date.now(),
        };
    }

    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    decodeExpiry(token: string): Date | null {
        try {
            const decoded = this.jwtService.decode(token) as any;
            if (decoded?.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch {
            return null;
        }
    }

    buildUserResponse(user: User) {
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
}
