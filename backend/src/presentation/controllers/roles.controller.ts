import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/requests/roles/roles.dto';
import {
    CreateRoleUseCase,
    GetAllRolesUseCase,
    GetRoleByIdUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
} from '../../application/rbac/use-cases';
import { GetPermissionTreeUseCase } from '../../application/rbac/use-cases/get-permission-tree.use-case';
import { AddPermissionsToRoleUseCase } from '../../application/rbac/use-cases/add-permissions-to-role.use-case';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(/* TenantGuard, AuthGuard, PermissionGuard */)
export class RolesController {
    constructor(
        private readonly createRoleUseCase: CreateRoleUseCase,
        private readonly getAllRolesUseCase: GetAllRolesUseCase,
        private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
        private readonly updateRoleUseCase: UpdateRoleUseCase,
        private readonly deleteRoleUseCase: DeleteRoleUseCase,
        private readonly getPermissionTreeUseCase: GetPermissionTreeUseCase,
        private readonly addPermissionsToRoleUseCase: AddPermissionsToRoleUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new custom role' })
    @ApiResponse({ status: 201, description: 'Role created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 409, description: 'Role already exists' })
    async create(@Body() dto: CreateRoleDto, @Req() req: any) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

        return this.createRoleUseCase.execute({
            ...dto,
            tenantId,
        });
    }

    @Get()
    @ApiOperation({ summary: 'Get all roles for tenant' })
    @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
    async findAll(@Req() req: any) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
        return this.getAllRolesUseCase.execute(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async findOne(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
        return this.getRoleByIdUseCase.execute(id, tenantId);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a role' })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 400, description: 'Cannot modify system role' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
        @Req() req: any,
    ) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

        return this.updateRoleUseCase.execute({
            id,
            tenantId,
            ...dto,
        });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a role' })
    @ApiResponse({ status: 200, description: 'Role deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete system role' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async delete(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
        await this.deleteRoleUseCase.execute(id, tenantId);
        return { message: 'Role deleted successfully' };
    }

    @Post(':id/permissions')
    @ApiOperation({ summary: 'Add permissions to a role' })
    @ApiResponse({ status: 200, description: 'Permissions added successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async addPermissions(
        @Param('id') id: string,
        @Body() body: { permissionIds: string[] },
        @Req() req: any,
    ) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
        return this.addPermissionsToRoleUseCase.execute(id, body.permissionIds, tenantId);
    }
}

// New controller for permissions
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
    constructor(
        private readonly getPermissionTreeUseCase: GetPermissionTreeUseCase,
    ) { }

    @Get('tree')
    @ApiOperation({ summary: 'Get permission tree' })
    @ApiResponse({ status: 200, description: 'Permission tree retrieved successfully' })
    getTree() {
        return this.getPermissionTreeUseCase.execute();
    }
}
