import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/tenant/tenant.guard';
import { AddPermissionsToUserUseCase } from '../../../application/rbac/use-cases/add-permissions-to-user.use-case';
import { CreateUserUseCase, UpdateUserUseCase } from '../../../application/user/use-cases';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';
import { Inject } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from '../auth/dto/user-response.dto';

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
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
    ) { }

    @Get()
    async getUsers(@Request() req) {
        const tenantId = req.user.tenantId;
        const users = await this.userRepository.findAll(tenantId);

        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
            } : null,
            permissions: user.permissions.map(p => ({
                id: p.id,
                resource: p.resource,
                displayName: p.displayName,
                actions: p.actions,
            })),
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
        }));
    }

    @Post()
    async createUser(@Request() req, @Body() dto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.createUserUseCase.execute({
            tenantId: req.user.tenantId,
            email: dto.email,
            name: dto.name,
            password: dto.password,
            roleId: dto.roleId,
            profilePicture: dto.profilePicture,
        });

        return UserResponseDto.fromDomain(user);
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
            roleId: user.roleId,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
            } : null,
            permissions: user.permissions.map(p => ({
                id: p.id,
                resource: p.resource,
                displayName: p.displayName,
                actions: p.actions,
            })),
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
        };
    }

    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.updateUserUseCase.execute({
            userId: id,
            email: dto.email,
            name: dto.name,
            roleId: dto.roleId,
            profilePicture: dto.profilePicture,
        });

        return UserResponseDto.fromDomain(user);
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
