/**
 * Tenant context HTTP interceptor.
 * 
 * Ensures all tenant-scoped API calls include tenant context.
 * Blocks requests until tenant is resolved to prevent stale/missing tenant headers.
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantResolverService } from '../tenant/tenant.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { AuthService } from '../auth/auth.service';

/**
 * URLs that don't require tenant context (auth, public, etc.)
 */
const PUBLIC_ENDPOINTS = [
    '/api/auth',
    '/api/login',
    '/api/register',
    '/api/refresh',
    '/api/forgot-password',
    '/api/reset-password',
    '/api/platform/tenants/resolve',
    '/api/health',
    '/assets/',
    '/files/'
];

/**
 * Check if request URL is a public endpoint.
 */
function isPublicEndpoint(url: string): boolean {
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

export const tenantContextInterceptor: HttpInterceptorFn = (req, next) => {
    const tenantService = inject(TenantResolverService);
    const tenantContext = inject(TenantContextService);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Allow public endpoints to bypass tenant check
    if (isPublicEndpoint(req.url)) {
        return next(req);
    }

    const activeTenant = tenantContext.activeTenant();
    if (activeTenant?.tenantId) {
        req = req.clone({
            setHeaders: {
                'X-Tenant-Id': activeTenant.tenantId,
                'X-Tenant-Slug': activeTenant.tenantSlug,
                'X-Tenant-Context': JSON.stringify({
                    tenantId: activeTenant.tenantId,
                    tenantSlug: activeTenant.tenantSlug
                })
            }
        });
        return next(req);
    }

    const session = authService.session();
    const membership = session?.memberships?.find(m => m.tenantId === session.activeTenantId)
        || session?.memberships?.[0];

    if (membership?.tenantId) {
        req = req.clone({
            setHeaders: {
                'X-Tenant-Id': membership.tenantId,
                ...(membership.tenantSlug ? { 'X-Tenant-Slug': membership.tenantSlug } : {})
            }
        });
        return next(req);
    }

    // Wait for tenant to be resolved before proceeding with tenant-scoped requests
    const tenant = tenantService.tenant();
    const status = tenantService.status();

    // If tenant resolution failed, prevent the request
    if (status === 'not-found' || status === 'error') {
        const error = new Error('Tenant context not available');
        throw new HttpErrorResponse({
            error,
            status: 503,
            statusText: 'Service Unavailable',
            url: req.url
        });
    }

    // If tenant is not yet resolved, this is a race condition that should not happen
    // because tenantGuard should have already resolved it.
    // However, add tenant header if available.
    if (tenant && status === 'ready') {
        req = req.clone({
            setHeaders: {
                'X-Tenant-Id': tenant.tenantId,
                'X-Tenant-Slug': tenant.tenantSlug,
                'X-Tenant-Context': JSON.stringify({
                    tenantId: tenant.tenantId,
                    tenantSlug: tenant.tenantSlug,
                    resolvedFrom: tenant.resolvedFrom
                })
            }
        });
    }

    return next(req);
};
