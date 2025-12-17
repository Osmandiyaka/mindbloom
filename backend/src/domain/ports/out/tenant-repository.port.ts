import { Tenant } from '../../tenant/entities/tenant.entity';
import { TENANT_REPOSITORY } from './repository.tokens';

export interface ITenantRepository {
    findAll(): Promise<Tenant[]>;
    findById(id: string): Promise<Tenant | null>;
    findBySubdomain(subdomain: string): Promise<Tenant | null>;
    findByCustomDomain(customDomain: string): Promise<Tenant | null>;
    create(tenant: Tenant): Promise<Tenant>;
    update(id: string, data: Partial<Tenant>): Promise<Tenant>;
    delete(id: string): Promise<void>;
}

export { TENANT_REPOSITORY } from './repository.tokens';
