import { Tenant, TenantPlan, TenantStatus } from '../../tenant/entities/tenant.entity';
import { TENANT_REPOSITORY } from './repository.tokens';

export interface TenantListQuery {
    search?: string;
    statuses?: TenantStatus[];
    plans?: TenantPlan[];
    trialExpiringBefore?: Date;
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'name' | 'status' | 'plan';
    sortDirection?: 'asc' | 'desc';
}

export interface TenantListResult {
    data: Tenant[];
    total: number;
    page: number;
    pageSize: number;
    usageTotals?: TenantUsageTotals;
    statusCounts?: TenantStatusCounts;
}

export interface TenantUsageTotals {
    students: number;
    teachers: number;
    classes: number;
    storageMb: number;
}

export interface TenantStatusCounts {
    active: number;
    suspended: number;
    trial: number;
    trialExpiring: number;
}

export interface ITenantRepository {
    findAll(): Promise<Tenant[]>;
    findById(id: string): Promise<Tenant | null>;
    findBySubdomain(subdomain: string): Promise<Tenant | null>;
    findByCustomDomain(customDomain: string): Promise<Tenant | null>;
    findWithFilters(query: TenantListQuery): Promise<TenantListResult>;
    create(tenant: Tenant): Promise<Tenant>;
    update(id: string, data: Partial<Tenant>): Promise<Tenant>;
    delete(id: string): Promise<void>;
}

export { TENANT_REPOSITORY } from './repository.tokens';
