import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CreateOrgUnitUseCase } from '../../application/org-units/use-cases/create-org-unit.use-case';
import { UpdateOrgUnitUseCase } from '../../application/org-units/use-cases/update-org-unit.use-case';
import { ListOrgUnitsUseCase } from '../../application/org-units/use-cases/list-org-units.use-case';
import { GetOrgUnitTreeUseCase } from '../../application/org-units/use-cases/get-org-unit-tree.use-case';
import { GetOrgUnitUseCase } from '../../application/org-units/use-cases/get-org-unit.use-case';
import { DeleteOrgUnitImpactUseCase } from '../../application/org-units/use-cases/delete-org-unit-impact.use-case';
import { DeleteOrgUnitUseCase } from '../../application/org-units/use-cases/delete-org-unit.use-case';
import { RestoreOrgUnitUseCase } from '../../application/org-units/use-cases/restore-org-unit.use-case';
import { ListOrgUnitMembersUseCase } from '../../application/org-units/use-cases/list-org-unit-members.use-case';
import { AddOrgUnitMembersUseCase } from '../../application/org-units/use-cases/add-org-unit-members.use-case';
import { RemoveOrgUnitMemberUseCase } from '../../application/org-units/use-cases/remove-org-unit-member.use-case';
import { ListOrgUnitRolesUseCase } from '../../application/org-units/use-cases/list-org-unit-roles.use-case';
import { AddOrgUnitRolesUseCase } from '../../application/org-units/use-cases/add-org-unit-roles.use-case';
import { RemoveOrgUnitRoleUseCase } from '../../application/org-units/use-cases/remove-org-unit-role.use-case';
import { OrgUnitDomainError } from '../../application/org-units/errors';
import { CreateOrgUnitDto } from '../dtos/requests/org-units/create-org-unit.dto';
import { UpdateOrgUnitDto } from '../dtos/requests/org-units/update-org-unit.dto';
import { DeleteOrgUnitDto } from '../dtos/requests/org-units/delete-org-unit.dto';
import { AddOrgUnitMembersDto } from '../dtos/requests/org-units/add-org-unit-members.dto';
import { AddOrgUnitRolesDto } from '../dtos/requests/org-units/add-org-unit-roles.dto';

@Controller('orgUnits')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrgUnitsController {
    constructor(
        private readonly createOrgUnitUseCase: CreateOrgUnitUseCase,
        private readonly updateOrgUnitUseCase: UpdateOrgUnitUseCase,
        private readonly listOrgUnitsUseCase: ListOrgUnitsUseCase,
        private readonly getOrgUnitTreeUseCase: GetOrgUnitTreeUseCase,
        private readonly getOrgUnitUseCase: GetOrgUnitUseCase,
        private readonly deleteOrgUnitImpactUseCase: DeleteOrgUnitImpactUseCase,
        private readonly deleteOrgUnitUseCase: DeleteOrgUnitUseCase,
        private readonly restoreOrgUnitUseCase: RestoreOrgUnitUseCase,
        private readonly listOrgUnitMembersUseCase: ListOrgUnitMembersUseCase,
        private readonly addOrgUnitMembersUseCase: AddOrgUnitMembersUseCase,
        private readonly removeOrgUnitMemberUseCase: RemoveOrgUnitMemberUseCase,
        private readonly listOrgUnitRolesUseCase: ListOrgUnitRolesUseCase,
        private readonly addOrgUnitRolesUseCase: AddOrgUnitRolesUseCase,
        private readonly removeOrgUnitRoleUseCase: RemoveOrgUnitRoleUseCase,
    ) { }

    @Get('tree')
    async getTree(@Request() req, @Query('status') status?: string) {
        try {
            const items = await this.getOrgUnitTreeUseCase.execute({
                tenantId: req.user.tenantId,
                status: status as any,
            });
            return { data: items };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get()
    async list(@Request() req,
        @Query('parentId') parentId?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
    ) {
        try {
            const result = await this.listOrgUnitsUseCase.execute({
                tenantId: req.user.tenantId,
                parentId: parentId ?? undefined,
                status: status as any,
                search,
                limit: limit ? Number(limit) : undefined,
                cursor,
            });
            return { data: result.items, meta: { nextCursor: result.nextCursor } };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':id')
    async getOne(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.getOrgUnitUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post()
    async create(@Request() req, @Body() dto: CreateOrgUnitDto) {
        try {
            const data = await this.createOrgUnitUseCase.execute({
                tenantId: req.user.tenantId,
                name: dto.name,
                code: dto.code,
                type: dto.type,
                status: dto.status,
                parentId: dto.parentId,
                sortOrder: dto.sortOrder,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateOrgUnitDto) {
        try {
            const data = await this.updateOrgUnitUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                name: dto.name,
                code: dto.code,
                type: dto.type,
                status: dto.status,
                sortOrder: dto.sortOrder,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/deleteImpact')
    async deleteImpact(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.deleteOrgUnitImpactUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string, @Body() dto: DeleteOrgUnitDto) {
        try {
            const data = await this.deleteOrgUnitUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                confirmationText: dto?.confirmationText,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/restore')
    async restore(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.restoreOrgUnitUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':id/members')
    async listMembers(
        @Request() req,
        @Param('id') id: string,
        @Query('search') search?: string,
        @Query('includeInherited') includeInherited?: string,
    ) {
        try {
            const data = await this.listOrgUnitMembersUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                search,
                includeInherited: includeInherited === 'true',
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/members')
    async addMembers(@Request() req, @Param('id') id: string, @Body() dto: AddOrgUnitMembersDto) {
        try {
            const data = await this.addOrgUnitMembersUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                userIds: dto.userIds,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Delete(':id/members/:userId')
    async removeMember(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
        try {
            const data = await this.removeOrgUnitMemberUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                userId,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':id/roles')
    async listRoles(
        @Request() req,
        @Param('id') id: string,
        @Query('includeInherited') includeInherited?: string,
    ) {
        try {
            const data = await this.listOrgUnitRolesUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                includeInherited: includeInherited === 'true',
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/roles')
    async addRoles(@Request() req, @Param('id') id: string, @Body() dto: AddOrgUnitRolesDto) {
        try {
            const data = await this.addOrgUnitRolesUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                roleIds: dto.roleIds,
                scope: dto.scope,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Delete(':id/roles/:roleId')
    async removeRole(@Request() req, @Param('id') id: string, @Param('roleId') roleId: string) {
        try {
            const data = await this.removeOrgUnitRoleUseCase.execute({
                tenantId: req.user.tenantId,
                orgUnitId: id,
                roleId,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    private handleError(err: unknown): never {
        if (err instanceof OrgUnitDomainError) {
            throw new HttpException({ error: err.code, message: err.message, details: err.details }, err.status);
        }
        throw err;
    }
}
