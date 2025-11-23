import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../../domain/rbac/entities/permission.entity';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permission Guard - Checks if user has required permissions
 * 
 * Usage:
 * @Permissions('students:read')
 * @UseGuards(PermissionGuard)
 * async findAll() { ... }
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No permissions required
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            return false; // No user or role
        }

        // Check if user's role has all required permissions
        return this.hasPermissions(user.role, requiredPermissions);
    }

    private hasPermissions(role: any, required: string[]): boolean {
        if (!role.permissions || role.permissions.length === 0) {
            return false;
        }

        // Check each required permission
        return required.every((requiredPerm) => {
            const [resource, action] = requiredPerm.split(':');

            // Find matching permission in role
            return role.permissions.some((permission: any) => {
                // Check wildcard (*)
                if (permission.resource === '*') {
                    return true;
                }

                // Check resource match
                if (permission.resource !== resource) {
                    return false;
                }

                // Check if action is allowed
                return (
                    permission.actions.includes(action) ||
                    permission.actions.includes(PermissionAction.MANAGE)
                );
            });
        });
    }
}
