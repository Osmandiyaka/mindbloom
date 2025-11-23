import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/tenant/tenant.guard';
import { AddPermissionsToUserUseCase } from '../../../application/rbac/use-cases/add-permissions-to-user.use-case';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';
import { Inject } from '@nestjs/common';

class AddPermissionsDto {
    @IsArray()
    @IsString({ each: true })
    permissionIds: string[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsersController {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly addPermissionsToUser: AddPermissionsToUserUseCase,
    ) { }

    @Get()
    async getUsers(@Request() req) {
        const tenantId = req.user.tenantId;
        const users = await this.userRepository.findAll(tenantId);

        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions.map(p => ({
                id: p.id,
                resource: p.resource,
                displayName: p.displayName,
                actions: p.actions,
            })),
            createdAt: user.createdAt,
        }));
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions.map(p => ({
                id: p.id,
                resource: p.resource,
                displayName: p.displayName,
                actions: p.actions,
            })),
            createdAt: user.createdAt,
        };
    }

    @Post(':id/permissions')
    async addPermissions(
        @Param('id') userId: string,
        @Body() dto: AddPermissionsDto,
    ) {
        const updatedUser = await this.addPermissionsToUser.execute(
            userId,
            dto.permissionIds,
        );

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            permissions: updatedUser.permissions.map(p => ({
                id: p.id,
                resource: p.resource,
                displayName: p.displayName,
                actions: p.actions,
            })),
        };
    }
}
