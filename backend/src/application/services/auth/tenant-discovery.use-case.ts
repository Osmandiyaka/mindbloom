import { Inject, Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/ports/out/tenant-repository.port';
import { TENANT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { TenantDiscoveryResponseDto, TenantDiscoveryTenantDto } from '../../../presentation/dtos/responses/auth/tenant-discovery.response.dto';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';

@Injectable()
export class TenantDiscoveryUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) {}

    async execute(email: string | null | undefined): Promise<TenantDiscoveryResponseDto> {
        const normalizedEmail = email?.trim().toLowerCase();
        const domain = this.extractDomain(normalizedEmail);
        if (!domain) {
            return this.neutralResponse();
        }

        const tenants = await this.tenantRepository.findByDiscoveryDomain(domain);
        if (!tenants.length) {
            return this.neutralResponse();
        }

        const mapped = tenants.map((tenant) => this.toDiscoveryTenant(tenant));
        const allowedAuthMethods = this.aggregateMethods(mapped);

        if (tenants.length === 1) {
            return {
                match: 'single',
                allowedAuthMethods,
                tenant: mapped[0],
            };
        }

        return {
            match: 'multiple',
            allowedAuthMethods,
            tenants: mapped,
        };
    }

    private neutralResponse(): TenantDiscoveryResponseDto {
        void this.userRepository;
        void this.tenantRepository;
        return {
            match: 'none',
            allowedAuthMethods: ['password'],
        };
    }

    private extractDomain(email: string | undefined | null): string | null {
        if (!email) {
            return null;
        }

        const atIndex = email.lastIndexOf('@');
        if (atIndex === -1 || atIndex === email.length - 1) {
            return null;
        }

        return email.slice(atIndex + 1);
    }

    private toDiscoveryTenant(tenant: Tenant): TenantDiscoveryTenantDto {
        return {
            tenantId: tenant.id,
            tenantSlug: tenant.subdomain,
            tenantName: tenant.name,
            logoUrl: tenant.customization?.logo,
            allowedAuthMethods: this.allowedMethodsForTenant(tenant),
        };
    }

    private allowedMethodsForTenant(tenant: Tenant): string[] {
        const methods = new Set<string>(['password']);
        if (tenant.ssoEnabled && tenant.ssoConfig?.provider) {
            const provider = tenant.ssoConfig.provider.toLowerCase();
            if (provider.includes('google')) {
                methods.add('google');
            } else if (provider.includes('microsoft') || provider.includes('azure')) {
                methods.add('microsoft');
            } else {
                methods.add('saml');
            }
        }
        return Array.from(methods);
    }

    private aggregateMethods(tenants: TenantDiscoveryTenantDto[]): string[] {
        const methods = new Set<string>();
        tenants.forEach((tenant) => tenant.allowedAuthMethods?.forEach((method) => methods.add(method)));
        if (!methods.size) {
            methods.add('password');
        }
        return Array.from(methods);
    }
}
