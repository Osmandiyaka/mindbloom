import { Controller, Get, Query, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from '../../application/services/audit/audit.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Response } from 'express';

@ApiTags('Host Audit')
@Controller('host/audit')
@UseGuards(JwtAuthGuard, HostContextGuard, PermissionGuard)
export class HostAuditController {
    constructor(private readonly audit: AuditService) { }

    @Get()
    @Permissions('Host.Audit.Read')
    @ApiOperation({ summary: 'Query host audit logs' })
    async list(@Query() query: any) {
        const filters: any = {
            q: query.q,
            tenantId: query.tenantId,
            actorEmail: query.actorEmail,
            action: query.action,
            category: query.category,
            severity: query.severity,
            result: query.result,
            targetType: query.targetType,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            page: query.page ? Number(query.page) : 1,
            pageSize: query.pageSize ? Number(query.pageSize) : 20,
        };
        return this.audit.query(filters);
    }

    @Get(':id')
    @Permissions('Host.Audit.Read')
    @ApiOperation({ summary: 'Get audit event by id' })
    @ApiResponse({ status: 200 })
    async get(@Param('id') id: string) {
        return this.audit.findById(id);
    }

    @Get('export/csv')
    @Permissions('Host.Audit.Export')
    @ApiOperation({ summary: 'Export audit logs as CSV' })
    async exportCsv(@Query() query: any, @Res() res: Response) {
        const csv = await this.audit.exportCsv({ ...query });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-export.csv"');
        res.send(csv);
    }
}
