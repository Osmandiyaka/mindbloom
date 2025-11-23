import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permission.guard';

/**
 * Permissions Decorator - Specifies required permissions for a route
 * 
 * @param permissions - Array of permission strings in format "resource:action"
 * 
 * @example
 * @Permissions('students:read', 'students:update')
 * async updateStudent() { ... }
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
