import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant.context';

/**
 * Ensures a request is executed in host (cross-tenant) context.
 * Blocks any request carrying a tenant context (JWT claim, resolved TenantContext, or header hint).
 */
@Injectable()
export class HostContextGuard implements CanActivate {
    constructor(private readonly tenantContext: TenantContext) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request?.user;

        if (!user) {
            throw new UnauthorizedException();
        }

        const tenantFromContext = this.safeTenantId();
        const tenantFromJwt = user.tenantId;
        const tenantFromHeader = request.headers?.['x-tenant-id'];

        if (tenantFromContext || tenantFromJwt || tenantFromHeader) {
            throw new ForbiddenException('HOST_CONTEXT_REQUIRED');
        }

        return true;
    }

    private safeTenantId(): string | null {
        try {
            return this.tenantContext.hasTenantId() ? this.tenantContext.tenantId : null;
        } catch {
            return null;
        }
    }
}
