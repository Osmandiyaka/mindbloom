import { Inject, Injectable } from '@nestjs/common';
import { Tenant, TenantPlan, TenantStatus } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { CreateTenantCommand } from '../../ports/in/commands/create-tenant.command';

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
            ownerId: command.ownerId || null,
            contactEmail: command.contactEmail,
            plan: (command.plan || TenantPlan.TRIAL) as TenantPlan,
            status: (command.status || TenantStatus.PENDING) as TenantStatus,
        });

        return await this.tenantRepository.create(tenant);
    }
}
