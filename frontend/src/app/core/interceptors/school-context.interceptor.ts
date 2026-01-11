/**
 * School context HTTP interceptor.
 *
 * Attaches active school header to tenant-scoped requests.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SchoolContextService } from '../school/school-context.service';

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

const isPublicEndpoint = (url: string) => PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

export const schoolContextInterceptor: HttpInterceptorFn = (req, next) => {
    if (isPublicEndpoint(req.url)) {
        return next(req);
    }

    const schoolContext = inject(SchoolContextService);
    const activeSchool = schoolContext.activeSchool();

    if (activeSchool?.id) {
        req = req.clone({
            setHeaders: {
                'X-School-Id': activeSchool.id
            }
        });
    }

    return next(req);
};
