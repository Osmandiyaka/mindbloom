import { Body, Controller, Param, Post, UseGuards, Get, Query, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantManager } from '../../application/services/tenant/tenant-manager.service';
import { AssignEditionDto } from '../dtos/requests/host-subscriptions/assign-edition.dto';
import { ExtendSubscriptionDto } from '../dtos/requests/host-subscriptions/extend-subscription.dto';
import { SuspendTenantDto } from '../dtos/requests/host-subscriptions/suspend-tenant.dto';
import { ChangeEditionDto } from '../dtos/requests/host-subscriptions/change-edition.dto';
import { GetTenantByIdUseCase } from '../../application/services/tenant';
import { AuditService } from '../../application/services/audit/audit.service';
import { TenantResponseDto } from '../dtos/responses/tenant/tenant-response.dto';
import { TenantMetricsResponseDto } from '../dtos/responses/host/tenant-metrics.response.dto';
import { TenantActivityItemDto } from '../dtos/responses/host/tenant-activity.response.dto';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { IUserRepository } from '../../domain/ports/out/user-repository.port';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { TenantInvoiceItemDto } from '../dtos/responses/host/tenant-invoice.response.dto';
import { TenantIssueItemDto } from '../dtos/responses/host/tenant-issue.response.dto';

@ApiTags('Host Tenant Subscriptions')
@Controller('host/tenants')
@UseGuards(JwtAuthGuard, HostContextGuard, PermissionGuard)
export class HostTenantSubscriptionsController {
    constructor(
        private readonly tenantManager: TenantManager,
        @Optional() private readonly getTenantByIdUseCase?: GetTenantByIdUseCase,
        @Optional() private readonly auditService?: AuditService,
        @Inject(USER_REPOSITORY) private readonly userRepository?: IUserRepository,
    ) { }

    @Get(':tenantId')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'Get tenant details (host-only)' })
    @ApiResponse({ status: 200, description: 'Tenant found', type: TenantResponseDto })
    async getTenant(@Param('tenantId') tenantId: string) {
        const tenant = await this.getTenantByIdUseCase.execute(tenantId);
        if (!tenant) return null;
        return TenantResponseDto.fromDomain(tenant);
    }

    @Get(':tenantId/metrics')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'Get tenant metrics (host-only)' })
    @ApiResponse({ status: 200, description: 'Tenant metrics', type: TenantMetricsResponseDto })
    async getTenantMetrics(@Param('tenantId') tenantId: string) {
        const tenant = await this.getTenantByIdUseCase.execute(tenantId);
        if (!tenant) return null;

        return {
            tenantId: tenant.id,
            studentsCount: tenant.usage?.currentStudents || 0,
            teachersCount: tenant.usage?.currentTeachers || 0,
            usersCount: (tenant.usage?.currentAdmins || 0) + (tenant.usage?.currentTeachers || 0),
            classesCount: tenant.usage?.currentClasses || 0,
            staffCount: tenant.usage?.currentAdmins || 0,
            storageUsedMb: tenant.usage?.currentStorage || 0,
            storageLimitMb: tenant.limits?.maxStorage ?? undefined,
        } as TenantMetricsResponseDto;
    }

    @Get(':tenantId/activity')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'Get recent tenant activity (host-only)' })
    @ApiResponse({ status: 200, description: 'Tenant activity', type: [TenantActivityItemDto] })
    async getTenantActivity(@Param('tenantId') tenantId: string, @Query('limit') limit?: string) {
        const lim = limit ? Number(limit) : 20;
        if (!this.auditService) return [] as TenantActivityItemDto[];

        const res = await this.auditService.query({ tenantId, page: 1, pageSize: lim });
        const items = (res?.items ?? []).map(a => ({
            id: a.id,
            tenantId: a.tenantId ?? tenantId,
            type: a.action ?? a.category ?? 'SYSTEM',
            message: a.message ?? a.action ?? a.category ?? '',
            createdAt: a.timestamp,
            actorEmail: a.actorEmailSnapshot ?? null,
        } as TenantActivityItemDto));

        return items;
    }

    @Get(':tenantId/users')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'List users for tenant (host)' })
    async getTenantUsers(@Param('tenantId') tenantId: string) {
        if (!this.userRepository) return [] as UserResponseDto[];
        const users = await this.userRepository.findAll(tenantId);
        return users.map(u => UserResponseDto.fromDomain(u));
    }

    @Get(':tenantId/invoices')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'List invoices for tenant (host)' })
    async getTenantInvoices(@Param('tenantId') tenantId: string) {
        if (!this.getTenantByIdUseCase) return [] as TenantInvoiceItemDto[];
        const tenant = await this.getTenantByIdUseCase.execute(tenantId);
        if (!tenant) return [] as TenantInvoiceItemDto[];
        const invs = (tenant.billing?.invoices || []).map(i => ({
            id: i.id,
            date: i.date,
            amount: i.amount,
            status: i.status,
        } as TenantInvoiceItemDto));
        return invs;
    }

    @Get(':tenantId/issues')
    @Permissions('Host.Tenants.Read')
    @ApiOperation({ summary: 'List tenant issues (from audit) (host)' })
    async getTenantIssues(@Param('tenantId') tenantId: string, @Query('limit') limit?: string) {
        const lim = limit ? Number(limit) : 20;
        if (!this.auditService) return [] as TenantIssueItemDto[];
        // Query audit service for issue-like events; this is a best-effort mapping
        const res = await this.auditService.query({ tenantId, page: 1, pageSize: lim, category: 'ISSUE' });
        const items = (res?.items ?? []).map(a => ({
            id: a.id,
            message: a.message ?? a.action ?? a.category ?? '',
            createdAt: a.timestamp,
            actorEmail: a.actorEmailSnapshot ?? null,
        } as TenantIssueItemDto));
        return items;
    }

    @Post(':tenantId/assign-edition')
    @Permissions('Host.Tenants.AssignEdition')
    @ApiOperation({ summary: 'Assign edition to tenant (host-only)' })
    async assignEdition(
        @Param('tenantId') tenantId: string,
        @Body() dto: AssignEditionDto,
    ) {
        await this.tenantManager.assignEditionToTenant(
            tenantId,
            dto.editionId ?? null,
            dto.subscriptionEndDate ? new Date(dto.subscriptionEndDate) : null,
            dto.behavior,
        );
        return { success: true };
    }

    @Post(':tenantId/extend-subscription')
    @Permissions('Host.Subscriptions.Manage')
    @ApiOperation({ summary: 'Extend tenant subscription (host-only)' })
    async extendSubscription(
        @Param('tenantId') tenantId: string,
        @Body() dto: ExtendSubscriptionDto,
    ) {
        await this.tenantManager.extendSubscription(tenantId, new Date(dto.newEndDate));
        return { success: true };
    }

    @Post(':tenantId/change-edition')
    @Permissions('Host.Subscriptions.Manage')
    @ApiOperation({ summary: 'Change tenant edition (host-only)' })
    async changeEdition(
        @Param('tenantId') tenantId: string,
        @Body() dto: ChangeEditionDto,
    ) {
        await this.tenantManager.changeEdition(
            tenantId,
            dto.editionId,
            new Date(dto.effectiveDate),
            dto.prorationPolicy,
        );
        return { success: true };
    }

    @Post(':tenantId/suspend')
    @Permissions('Host.Subscriptions.Manage')
    @ApiOperation({ summary: 'Suspend tenant (host-only)' })
    async suspendTenant(
        @Param('tenantId') tenantId: string,
        @Body() dto: SuspendTenantDto,
    ) {
        await this.tenantManager.suspendTenant(tenantId, dto.reason);
        return { success: true };
    }

    @Post(':tenantId/reactivate')
    @Permissions('Host.Subscriptions.Manage')
    @ApiOperation({ summary: 'Reactivate tenant (host-only)' })
    async reactivateTenant(
        @Param('tenantId') tenantId: string,
    ) {
        await this.tenantManager.reactivateTenant(tenantId);
        return { success: true };
    }
}
