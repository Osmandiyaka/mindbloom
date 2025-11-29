import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TENANT_REPOSITORY, ITenantRepository } from '../../domain/ports/out/tenant-repository.port';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantResolutionService {
    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
        private readonly tenantContext: TenantContext,
    ) { }

    /**
     * Resolve tenant id from request (JWT → header → subdomain lookup) and store in context.
     */
    async resolve(request: any): Promise<string> {
        // short-circuit if already set
        if (this.tenantContext.hasTenantId()) {
            return this.tenantContext.tenantId;
        }

        // 1. JWT payload
        if (request.user?.tenantId) {
            this.tenantContext.setTenantId(request.user.tenantId);
            return request.user.tenantId;
        }

        // 2. Header
        const headerTenantId = request.headers?.['x-tenant-id'];
        if (headerTenantId) {
            this.tenantContext.setTenantId(headerTenantId);
            return headerTenantId;
        }

        // 3. Subdomain lookup
        const host: string | undefined = request.headers?.host;
        const subdomain = host ? host.split('.')[0] : null;
        if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
            const tenant = await this.tenantRepository.findBySubdomain(subdomain);
            if (tenant) {
                this.tenantContext.setTenantId(tenant.id);
                return tenant.id;
            }
        }

        throw new UnauthorizedException('Tenant context not found');
    }
}
