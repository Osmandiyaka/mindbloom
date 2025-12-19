import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../../domain/rbac/entities/permission.entity';
import { IUserRepository } from '../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';

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
    constructor(
        private reflector: Reflector,
        @Inject(USER_REPOSITORY) private userRepository: IUserRepository
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No permissions required
        }

        const request = context.switchToHttp().getRequest();
        const jwtUser = request.user; // From JWT payload

        if (!jwtUser || !jwtUser.userId) {
            throw new UnauthorizedException();
        }

        // Host Admin has all permissions
        if (jwtUser.roleName === 'Host Admin') {
            return true;
        }

        // Fetch full user with populated role
        const user = await this.userRepository.findById(jwtUser.userId);

        if (!user || !user.role) {
            return false; // No user or role
        }

        // Check if user's role has all required permissions
        const allowed = this.hasPermissions(user.role, requiredPermissions);
        if (!allowed) {
            throw new ForbiddenException('INSUFFICIENT_PERMISSIONS');
        }

        return true;
    }

    private hasPermissions(role: any, required: string[]): boolean {
        if (!role.permissions || role.permissions.length === 0) {
            return false;
        }

        // Check each required permission
        return required.every((requiredPerm) => {
            if (requiredPerm.startsWith('Host.') && !(role.name && role.name.toLowerCase().includes('host'))) {
                return false;
            }

            const colonIndex = requiredPerm.indexOf(':');
            if (colonIndex === -1) {
                return role.permissions.some((permission: any) =>
                    permission.resource === '*' ||
                    permission.id === requiredPerm ||
                    permission.resource === requiredPerm,
                );
            }

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
