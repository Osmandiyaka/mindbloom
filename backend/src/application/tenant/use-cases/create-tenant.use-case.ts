import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/tenant/ports/tenant.repository.interface';

export interface CreateTenantCommand {
    name: string;
    subdomain: string;
    plan?: 'free' | 'basic' | 'premium' | 'enterprise';
    status?: 'active' | 'suspended' | 'inactive';
}

@Injectable()
export class CreateTenantUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(command: CreateTenantCommand): Promise<Tenant> {
        const tenant = Tenant.create({
            name: command.name,
            subdomain: command.subdomain,
            plan: command.plan || 'free',
            status: command.status || 'active',
        });

        return await this.tenantRepository.create(tenant);
    }
}
