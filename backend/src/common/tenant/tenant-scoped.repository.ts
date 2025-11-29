import { FilterQuery } from 'mongoose';
import { TenantContext } from './tenant.context';

/**
 * Base class to enforce tenant scoping on repository operations.
 * Repositories should extend this and use `withTenantFilter` / `requireTenant` to guard all data access.
 */
export abstract class TenantScopedRepository<TDoc extends { tenantId?: any }, TEntity> {
    constructor(protected readonly tenantContext: TenantContext) { }

    /**
     * Resolve tenantId from explicit argument or request context; throws if missing.
     */
    protected requireTenant(tenantId?: string): string {
        if (tenantId) {
            return tenantId;
        }
        if (this.tenantContext.hasTenantId()) {
            return this.tenantContext.tenantId;
        }
        throw new Error('Tenant ID is required for tenant-scoped repository operations');
    }

    /**
     * Merge a filter with the required tenant constraint.
     */
    protected withTenantFilter(filter: FilterQuery<TDoc>, tenantId?: string): FilterQuery<TDoc> {
        const resolved = this.requireTenant(tenantId);
        return { ...filter, tenantId: resolved } as FilterQuery<TDoc>;
    }
}
