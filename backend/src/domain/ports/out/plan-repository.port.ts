import { BillingInterval, Plan, PlanModule, PlanStatus } from '../../subscription/entities/plan.entity';
import { PLAN_REPOSITORY } from './repository.tokens';

export interface PlanRepository {
    create(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan>;
    update(planId: string, update: Partial<Omit<Plan, 'id' | 'modules'>> & { modules?: PlanModule[] }): Promise<Plan>;
    findById(id: string): Promise<Plan | null>;
    findByName(name: string): Promise<Plan | null>;
    list(params?: { status?: PlanStatus; page?: number; pageSize?: number }): Promise<{ data: Plan[]; total: number; page: number; pageSize: number }>;
}

export { PLAN_REPOSITORY } from './repository.tokens';
export { BillingInterval, PlanStatus, PlanModule } from '../../subscription/entities/plan.entity';
