import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
    constructor(private tenantService: TenantService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const tenantId = this.tenantService.getTenantId();

        if (tenantId) {
            // Clone the request and add the tenant ID header
            request = request.clone({
                setHeaders: {
                    'X-Tenant-Id': tenantId
                }
            });
        }

        return next.handle(request);
    }
}
