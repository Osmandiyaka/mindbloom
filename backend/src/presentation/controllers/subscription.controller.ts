import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { GetSubscriptionUseCase } from '../../application/services/subscription/get-subscription.use-case';
import { ChangePlanUseCase } from '../../application/services/subscription/change-plan.use-case';
import { ChangePlanCommand } from '../../application/ports/in/commands/change-plan.command';
import { ChangePlanDto } from '../dtos/requests/subscription/change-plan.dto';

@ApiTags('Subscription')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('subscriptions')
export class SubscriptionController {
    constructor(
        private readonly tenantContext: TenantContext,
        private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
        private readonly changePlanUseCase: ChangePlanUseCase,
    ) { }

    @Get('current')
    @ApiOperation({ summary: 'Get current subscription' })
    async getCurrent() {
        return this.getSubscriptionUseCase.execute(this.tenantContext.tenantId, 'billing@tenant.local');
    }

    @Post('change-plan')
    @ApiOperation({ summary: 'Change subscription plan' })
    async changePlan(@Body() dto: ChangePlanDto) {
        const command = new ChangePlanCommand(
            this.tenantContext.tenantId,
            dto.planId || null,
            dto.plan,
            dto.billingEmail,
            dto.paymentMethodLast4,
            dto.paymentBrand,
        );
        return this.changePlanUseCase.execute(command);
    }
}
