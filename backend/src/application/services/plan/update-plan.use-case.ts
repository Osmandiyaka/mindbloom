import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PlanRepository, PLAN_REPOSITORY } from '../../../domain/ports/out/plan-repository.port';
import { BillingInterval, Plan, PlanModule, PlanStatus } from '../../../domain/subscription/entities/plan.entity';
import { RecomputePlanEntitlementsService } from './recompute-plan-entitlements.service';

export interface UpdatePlanCommand {
    id: string;
    name?: string;
    description?: string;
    status?: PlanStatus;
    currency?: string;
    priceAmount?: number;
    billingInterval?: BillingInterval;
    modules?: PlanModule[];
}

@Injectable()
export class UpdatePlanUseCase {
    private readonly logger = new Logger(UpdatePlanUseCase.name);

    constructor(
        @Inject(PLAN_REPOSITORY) private readonly planRepository: PlanRepository,
        private readonly recomputeEntitlements: RecomputePlanEntitlementsService,
    ) { }

    async execute(command: UpdatePlanCommand): Promise<Plan> {
        const current = await this.planRepository.findById(command.id);
        if (!current) {
            throw new NotFoundException('Plan not found');
        }

        if (command.name && command.name !== current.name) {
            const byName = await this.planRepository.findByName(command.name);
            if (byName && byName.id !== current.id) {
                throw new BadRequestException('Plan name must be unique');
            }
        }

        const updated = await this.planRepository.update(command.id, command);
        await this.recomputeEntitlements.recompute(updated.id, updated.modules);
        this.logger.log(`Plan updated: ${updated.id}`);
        return updated;
    }
}
