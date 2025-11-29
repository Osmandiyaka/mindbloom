import { Inject, Injectable } from '@nestjs/common';
import { Tenant, TenantPlan, TenantStatus } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { CreateTenantCommand } from '../../ports/in/commands/create-tenant.command';
import { InitializeSystemRolesUseCase } from '../rbac/initialize-system-roles.use-case';
import { CreateUserUseCase } from '../user';
import { SYSTEM_ROLE_NAMES } from '../../../domain/rbac/entities/system-roles';

@Injectable()
export class CreateTenantUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        private readonly initializeSystemRolesUseCase: InitializeSystemRolesUseCase,
        private readonly createUserUseCase: CreateUserUseCase,
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

        const createdTenant = await this.tenantRepository.create(tenant);

        try {
            const roles = await this.initializeSystemRolesUseCase.execute(createdTenant.id);
            const tenantAdminRole = roles.find((role) => role.name === SYSTEM_ROLE_NAMES.TENANT_ADMIN)
                || roles.find((role) => role.name === SYSTEM_ROLE_NAMES.SUPER_ADMIN);

            if (!tenantAdminRole) {
                throw new Error('Tenant Admin role could not be initialized');
            }

            const adminUser = await this.createUserUseCase.execute({
                tenantId: createdTenant.id,
                email: command.adminEmail,
                name: command.adminName,
                password: command.adminPassword,
                roleId: tenantAdminRole.id,
            });

            return await this.tenantRepository.update(createdTenant.id, {
                ...createdTenant,
                ownerId: adminUser.id,
            } as Tenant);
        } catch (error) {
            await this.tenantRepository.delete(createdTenant.id);
            throw error;
        }
    }
}
