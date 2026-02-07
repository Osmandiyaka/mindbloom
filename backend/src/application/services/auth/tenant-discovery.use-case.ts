import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/out/user-repository.port';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { USER_REPOSITORY, TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { TenantDiscoveryResponseDto } from '../../../presentation/dtos/responses/auth/tenant-discovery.response.dto';

@Injectable()
export class TenantDiscoveryUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) {}

    async execute(email: string | null | undefined): Promise<TenantDiscoveryResponseDto> {
        const normalized = email?.trim().toLowerCase();
        if (!normalized) {
            return this.neutralResponse();
        }

        // Tenant discovery logic will be implemented incrementally.
        // For now respond with the neutral path to avoid account enumeration.
        return this.neutralResponse();
    }

    private neutralResponse(): TenantDiscoveryResponseDto {
        void this.userRepository;
        void this.tenantRepository;
        return {
            match: 'none',
            allowedAuthMethods: ['password'],
        };
    }
}
