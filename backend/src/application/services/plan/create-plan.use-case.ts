import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PlanRepository, PLAN_REPOSITORY } from '../../../domain/ports/out/plan-repository.port';
import { BillingInterval, ModuleKey, Plan, PlanModule, PlanStatus } from '../../../domain/subscription/entities/plan.entity';
import { RecomputePlanEntitlementsService } from './recompute-plan-entitlements.service';

export interface CreatePlanCommand {
    name: string;
    description: string;
    status?: PlanStatus;
    currency: string;
    priceAmount: number;
    billingInterval: BillingInterval;
    modules: PlanModule[];
}

@Injectable()
export class CreatePlanUseCase {
    private readonly logger = new Logger(CreatePlanUseCase.name);

    constructor(
        @Inject(PLAN_REPOSITORY) private readonly planRepository: PlanRepository,
        private readonly recomputeEntitlements: RecomputePlanEntitlementsService,
    ) { }

    async execute(command: CreatePlanCommand): Promise<Plan> {
        const existing = await this.planRepository.findByName(command.name);
        if (existing) {
            throw new BadRequestException('Plan name must be unique');
        }

        const plan = await this.planRepository.create({
            ...command,
            status: command.status || PlanStatus.ACTIVE,
        });

        await this.recomputeEntitlements.recompute(plan.id, plan.modules);
        this.logger.log(`Plan created: ${plan.id}`);
        return plan;
    }
}
