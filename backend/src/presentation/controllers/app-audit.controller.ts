import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from '../../application/services/audit/audit.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionGuard } from '../../common/guards/permission.guard';

@ApiTags('Tenant Audit')
@Controller('app/audit')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AppAuditController {
    constructor(private readonly audit: AuditService) { }

    @Get()
    @Permissions('Audit.Read')
    @ApiOperation({ summary: 'Query tenant audit logs' })
    async list(@Query() query: any, @Query('tenantId') overrideTenantId?: string) {
        // ensure tenant scoping to current tenant (TenantGuard provides context)
        const filters: any = {
            q: query.q,
            tenantId: query.tenantId || overrideTenantId,
            actorEmail: query.actorEmail,
            action: query.action,
            category: query.category,
            severity: query.severity,
            result: query.result,
            targetType: query.targetType,
            targetId: query.targetId,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            page: query.page ? Number(query.page) : 1,
            pageSize: query.pageSize ? Number(query.pageSize) : 20,
        };
        return this.audit.query(filters);
    }

    @Get(':id')
    @Permissions('Audit.Read')
    @ApiOperation({ summary: 'Get audit event by id (tenant)' })
    async get(@Param('id') id: string) {
        return this.audit.findById(id);
    }
}
