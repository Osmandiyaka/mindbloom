import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantResolutionService } from './tenant-resolution.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private tenantResolver: TenantResolutionService,
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
        await this.tenantResolver.resolve(request);
        return true;
    }
}
