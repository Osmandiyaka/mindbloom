import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantManager } from '../../application/services/tenant/tenant-manager.service';
import { AssignEditionDto } from '../dtos/requests/host-subscriptions/assign-edition.dto';
import { ExtendSubscriptionDto } from '../dtos/requests/host-subscriptions/extend-subscription.dto';
import { SuspendTenantDto } from '../dtos/requests/host-subscriptions/suspend-tenant.dto';
import { ChangeEditionDto } from '../dtos/requests/host-subscriptions/change-edition.dto';

@ApiTags('Host Tenant Subscriptions')
@Controller('host/tenants')
@UseGuards(JwtAuthGuard, HostContextGuard, PermissionGuard)
export class HostTenantSubscriptionsController {
    constructor(private readonly tenantManager: TenantManager) { }

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
