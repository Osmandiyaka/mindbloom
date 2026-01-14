import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { EntitlementsService } from '../../application/services/entitlements/entitlements.service';

@ApiTags('Entitlements')
@Controller('entitlements')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EntitlementsController {
    constructor(
        private readonly entitlements: EntitlementsService,
        private readonly tenantContext: TenantContext,
    ) { }

    @Get('me')
    @ApiOperation({ summary: 'Get effective entitlements for current tenant' })
    async me() {
        const tenantId = this.tenantContext.tenantId;
        return this.entitlements.getEntitlementsForTenant(tenantId);
    }
}
