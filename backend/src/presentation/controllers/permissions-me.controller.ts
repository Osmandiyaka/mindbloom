import { Controller, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { IUserRepository } from '../../domain/ports/out/user-repository.port';
import { Inject } from '@nestjs/common';
import { PermissionAction } from '../../domain/rbac/entities/permission.entity';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PermissionsMeController {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) {}

    @Get('me')
    @ApiOperation({ summary: 'Get permissions for current user' })
    async me(@Req() req: any) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new UnauthorizedException();
        }

        const user = await this.userRepository.findById(userId);
        if (!user || !user.role) {
            return { permissions: [] };
        }

        const permissions = (user.role.permissions || []).flatMap((permission: any) => {
            if (!permission?.resource) {
                return [];
            }
            if (permission.resource === '*') {
                return ['*'];
            }
            const actions = Array.isArray(permission.actions) && permission.actions.length
                ? permission.actions
                : [PermissionAction.READ];
            return actions.map((action: string) => `${permission.resource}:${action}`);
        });

        return { permissions };
    }
}
