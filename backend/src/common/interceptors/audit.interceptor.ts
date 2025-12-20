import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req: any = ctx.getRequest();
        const res: any = ctx.getResponse();

        // Ensure correlation id exists
        const correlationId = req.headers['x-correlation-id'] || uuidv4();
        req.headers['x-correlation-id'] = correlationId;
        req.correlationId = correlationId;

        const start = Date.now();

        // Attach a small audit context for use by services
        req.auditContext = {
            correlationId,
            requestId: req.headers['x-request-id'] || null,
            traceId: req.headers['x-trace-id'] || null,
            actor: req.user || null,
            ipAddress: req.ip || req.connection?.remoteAddress || null,
            userAgent: req.get ? req.get('user-agent') : req.headers['user-agent'] || null,
            route: req.originalUrl || req.url,
            method: req.method,
        };

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - start;
                    // attach to response locals for potential logging
                    res.locals.audit = { statusCode: res.statusCode, durationMs: duration };
                },
            })
        );
    }
}
