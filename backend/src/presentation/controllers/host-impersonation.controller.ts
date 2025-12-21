import { Body, Controller, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ImpersonateUserUseCase, ImpersonationResult } from '../../application/services/auth/impersonate-user.use-case';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Host Impersonation')
@Controller('host/impersonation')
@UseGuards(JwtAuthGuard, HostContextGuard, PermissionGuard)
export class HostImpersonationController {
    constructor(
        private readonly impersonateUser: ImpersonateUserUseCase,
        private readonly configService: ConfigService,
    ) { }

    @Post('tenant/:tenantId')
    @Permissions('Host.Users.Impersonate')
    @ApiOperation({ summary: 'Impersonate a tenant (auto-select admin user)' })
    @ApiResponse({ status: 200 })
    async impersonateTenant(@Param('tenantId') tenantId: string, @Body() body: { reason?: string }, @Req() req: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.impersonateUser.execute({
            tenantId,
            impersonatorUserId: req?.user?.userId,
            impersonatorEmail: req?.user?.email ?? null,
            reason: body?.reason ?? null,
        });

        this.setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
        return this.mapResponse(result);
    }

    @Post('tenant/:tenantId/users/:userId')
    @Permissions('Host.Users.Impersonate')
    @ApiOperation({ summary: 'Impersonate a specific user within a tenant' })
    @ApiResponse({ status: 200 })
    async impersonateUserInTenant(@Param('tenantId') tenantId: string, @Param('userId') userId: string, @Body() body: { reason?: string }, @Req() req: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.impersonateUser.execute({
            tenantId,
            userId,
            impersonatorUserId: req?.user?.userId,
            impersonatorEmail: req?.user?.email ?? null,
            reason: body?.reason ?? null,
        });

        this.setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
        return this.mapResponse(result);
    }

    private mapResponse(result: ImpersonationResult) {
        return {
            user: result.user,
            memberships: result.memberships,
            activeTenantId: result.activeTenantId,
            tokens: {
                accessToken: result.access_token,
                refreshToken: result.refreshToken,
                tokenType: 'Bearer',
            },
            expiresAt: result.expiresAt,
            issuedAt: result.issuedAt,
            isHost: false,
            tenantSlug: result.tenantSlug,
            impersonatedBy: result.impersonatedBy,
        };
    }

    private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date) {
        const secure = this.configService.get('NODE_ENV') === 'production';
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure,
            sameSite: secure ? 'strict' : 'lax',
            expires: expiresAt,
            path: '/api/auth',
        });
    }
}
