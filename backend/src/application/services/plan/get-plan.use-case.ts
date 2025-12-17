import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PlanRepository, PLAN_REPOSITORY } from '../../../domain/ports/out/plan-repository.port';
import { Plan } from '../../../domain/subscription/entities/plan.entity';

@Injectable()
export class GetPlanUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY) private readonly planRepository: PlanRepository,
    ) { }

    async execute(id: string): Promise<Plan> {
        const plan = await this.planRepository.findById(id);
        if (!plan) {
            throw new NotFoundException('Plan not found');
        }
        return plan;
    }
}
