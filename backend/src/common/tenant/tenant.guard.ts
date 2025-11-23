import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from './tenant.context';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private tenantContext: TenantContext,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // Extract tenant from different sources (priority order)
        let tenantId = this.extractTenantFromRequest(request);

        if (!tenantId) {
            throw new UnauthorizedException('Tenant context not found');
        }

        // Set tenant in context
        this.tenantContext.setTenantId(tenantId);

        return true;
    }

    private extractTenantFromRequest(request: any): string | null {
        // 1. Check JWT payload (if user is authenticated)
        if (request.user?.tenantId) {
            return request.user.tenantId;
        }

        // 2. Check custom header
        const headerTenantId = request.headers['x-tenant-id'];
        if (headerTenantId) {
            return headerTenantId;
        }

        // 3. Check subdomain (e.g., school1.mindbloom.com)
        const host = request.headers.host;
        if (host) {
            const subdomain = host.split('.')[0];
            // TODO: Map subdomain to tenantId via database lookup
            // For now, we'll use the subdomain as tenantId
            if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
                return subdomain;
            }
        }

        return null;
    }
}
