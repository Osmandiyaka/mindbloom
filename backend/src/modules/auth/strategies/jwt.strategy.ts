import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET') || 'your-secret-key',
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.sub,
            email: payload.email,
            roleId: payload.roleId,
            roleIds: payload.roleIds ?? [],
            roleName: payload.roleName,
            tenantId: payload.tenantId,
            impersonated: payload.impersonated ?? false,
            impersonatorId: payload.impersonatorId,
            impersonatorEmail: payload.impersonatorEmail,
            impersonationReason: payload.impersonationReason,
        };
    }
}
