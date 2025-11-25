import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/tenant/tenant.guard';
import { TenantContext } from '../../../common/tenant/tenant.context';
import { GetSubscriptionUseCase } from '../../../application/subscription/use-cases/get-subscription.use-case';
import { ChangePlanUseCase, ChangePlanCommand } from '../../../application/subscription/use-cases/change-plan.use-case';
import { SubscriptionPlan } from '../../../domain/subscription/entities/subscription.entity';

class ChangePlanDto {
    plan!: SubscriptionPlan;
    billingEmail!: string;
    paymentMethodLast4?: string;
    paymentBrand?: string;
}

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
            dto.plan,
            dto.billingEmail,
            dto.paymentMethodLast4,
            dto.paymentBrand,
        );
        return this.changePlanUseCase.execute(command);
    }
}
