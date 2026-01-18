import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
    Delete,
    Query,
    HttpException,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { AddPermissionsToUserUseCase } from '../../application/services/rbac/add-permissions-to-user.use-case';
import { CreateUserDto } from '../dtos/requests/users/create-user.dto';
import { UpdateUserDto } from '../dtos/requests/users/update-user.dto';
import { InviteUsersDto } from '../dtos/requests/users/invite-users.dto';
import { UserDomainError } from '../../application/users/errors';
import {
    ActivateUserUseCase,
    CreateUserUseCase,
    GetUserUseCase,
    InviteUsersUseCase,
    ListUsersUseCase,
    SuspendUserUseCase,
    UpdateUserUseCase,
} from '../../application/users/use-cases';
import { DeleteUserUseCase } from '../../application/services/user';

class AddPermissionsDto {
    @IsArray()
    @IsString({ each: true })
    permissionIds: string[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsersController {
    constructor(
        private readonly addPermissionsToUser: AddPermissionsToUserUseCase,
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly listUsersUseCase: ListUsersUseCase,
        private readonly getUserUseCase: GetUserUseCase,
        private readonly inviteUsersUseCase: InviteUsersUseCase,
        private readonly suspendUserUseCase: SuspendUserUseCase,
        private readonly activateUserUseCase: ActivateUserUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
    ) { }

    @Get()
    async getUsers(
        @Request() req,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('roleId') roleId?: string,
        @Query('schoolId') schoolId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        try {
            const result = await this.listUsersUseCase.execute({
                tenantId: req.user.tenantId,
                search,
                status: status as any,
                roleId,
                schoolId,
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
            return { data: result.items, meta: result.meta };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post()
    async createUser(@Request() req, @Body() dto: CreateUserDto) {
        try {
            const user = await this.createUserUseCase.execute({
                tenantId: req.user.tenantId,
                email: dto.email,
                name: dto.name,
                password: dto.password,
                roleIds: dto.roleIds,
                schoolAccess: dto.schoolAccess ?? { scope: 'all' },
                profilePicture: dto.profilePicture,
                gender: dto.gender,
                dateOfBirth: dto.dateOfBirth,
                phone: dto.phone,
                forcePasswordReset: dto.forcePasswordReset,
                mfaEnabled: dto.mfaEnabled,
                status: dto.status,
            });
            return { data: user };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post('invite')
    async inviteUsers(@Request() req, @Body() dto: InviteUsersDto) {
        try {
            const users = await this.inviteUsersUseCase.execute({
                tenantId: req.user.tenantId,
                emails: dto.emails,
                roleIds: dto.roleIds,
                schoolAccess: dto.schoolAccess ?? { scope: 'all' },
            });
            return { data: users };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':id')
    async getUser(@Request() req, @Param('id') id: string) {
        try {
            const user = await this.getUserUseCase.execute({
                tenantId: req.user.tenantId,
                userId: id,
            });
            return { data: user };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch(':id')
    async updateUser(@Request() req, @Param('id') id: string, @Body() dto: UpdateUserDto) {
        try {
            const user = await this.updateUserUseCase.execute({
                tenantId: req.user.tenantId,
                userId: id,
                email: dto.email,
                name: dto.name,
                roleIds: dto.roleIds,
                schoolAccess: dto.schoolAccess,
                profilePicture: dto.profilePicture,
                gender: dto.gender,
                dateOfBirth: dto.dateOfBirth,
                phone: dto.phone,
                forcePasswordReset: dto.forcePasswordReset,
                mfaEnabled: dto.mfaEnabled,
                status: dto.status,
            });
            return { data: user };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/suspend')
    async suspendUser(@Request() req, @Param('id') id: string) {
        try {
            const user = await this.suspendUserUseCase.execute({
                tenantId: req.user.tenantId,
                userId: id,
            });
            return { data: user };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/activate')
    async activateUser(@Request() req, @Param('id') id: string) {
        try {
            const user = await this.activateUserUseCase.execute({
                tenantId: req.user.tenantId,
                userId: id,
            });
            return { data: user };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Delete(':id')
    async deleteUser(@Request() req, @Param('id') id: string) {
        try {
            await this.deleteUserUseCase.execute(id, req.user.tenantId);
            return { data: { success: true } };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/permissions')
    async addPermissions(
        @Param('id') userId: string,
        @Body() dto: AddPermissionsDto,
    ) {
        try {
            const updatedUser = await this.addPermissionsToUser.execute(
                userId,
                dto.permissionIds,
            );

            return {
                data: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    roleIds: updatedUser.roleIds,
                    permissions: updatedUser.permissions.map(p => ({
                        id: p.id,
                        resource: p.resource,
                        displayName: p.displayName,
                        actions: p.actions,
                    })),
                }
            };
        } catch (err) {
            this.handleError(err);
        }
    }

    private handleError(err: unknown): never {
        if (err instanceof UserDomainError) {
            throw new HttpException({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
        }
        throw err;
    }
}
