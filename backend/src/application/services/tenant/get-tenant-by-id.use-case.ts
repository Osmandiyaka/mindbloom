import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';

@Injectable()
export class GetTenantByIdUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(id: string): Promise<Tenant | null> {
        return await this.tenantRepository.findById(id);
    }
}
