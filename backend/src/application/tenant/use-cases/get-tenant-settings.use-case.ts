import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/tenant/ports/tenant.repository.interface';
import { TenantSettings } from '../../../domain/tenant/entities/tenant.entity';

@Injectable()
export class GetTenantSettingsUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(tenantId: string): Promise<TenantSettings> {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant.settings || {};
    }
}
