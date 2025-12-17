import { Inject, Injectable } from '@nestjs/common';
import { PlanRepository, PLAN_REPOSITORY } from '../../../domain/ports/out/plan-repository.port';
import { Plan, PlanStatus } from '../../../domain/subscription/entities/plan.entity';

export interface ListPlansQuery {
    status?: PlanStatus;
    page?: number;
    pageSize?: number;
}

@Injectable()
export class ListPlansUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY) private readonly planRepository: PlanRepository,
    ) { }

    async execute(query: ListPlansQuery): Promise<{ data: Plan[]; total: number; page: number; pageSize: number }> {
        return this.planRepository.list(query);
    }
}
