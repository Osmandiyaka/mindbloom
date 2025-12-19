/**
 * Unit tests for PermissionEngine
 * 
 * Tests pure permission evaluation logic:
 * - Deny by default
 * - Allow by explicit grant
 * - Role aggregation
 * - Determinism
 */

import { PermissionEngine } from './permission-engine';
import { RoleDefinition, UserSession } from './permissions.types';

describe('PermissionEngine', () => {
    describe('buildGrantedPermissions', () => {
        it('should return empty set when session is null', () => {
            const roles: RoleDefinition[] = [
                { id: 'admin', name: 'Admin', permissions: ['students.read'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(null, roles);

            expect(granted.size).toBe(0);
        });

        it('should return empty set when session has no roles', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: []
            };
            const roles: RoleDefinition[] = [
                { id: 'admin', name: 'Admin', permissions: ['students.read'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.size).toBe(0);
        });

        it('should grant permissions from single role', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                {
                    id: 'teacher',
                    name: 'Teacher',
                    permissions: ['students.read', 'attendance.mark']
                }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('attendance.mark')).toBe(true);
            expect(granted.size).toBe(2);
        });

        it('should merge permissions from multiple roles', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher', 'librarian']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] },
                { id: 'librarian', name: 'Librarian', permissions: ['library.issue'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('library.issue')).toBe(true);
            expect(granted.size).toBe(2);
        });

        it('should deduplicate permissions across roles', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher', 'staff']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read', 'attendance.mark'] },
                { id: 'staff', name: 'Staff', permissions: ['students.read', 'library.read'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('attendance.mark')).toBe(true);
            expect(granted.has('library.read')).toBe(true);
            expect(granted.size).toBe(3); // students.read counted once
        });

        it('should ignore non-existent role IDs', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher', 'nonexistent']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.has('students.read')).toBe(true);
            expect(granted.size).toBe(1);
        });

        it('should add explicit allow overrides', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher'],
                permissionOverrides: {
                    allow: ['admin.debug']
                }
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            const granted = PermissionEngine.buildGrantedPermissions(session, roles);

            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('admin.debug')).toBe(true);
            expect(granted.size).toBe(2);
        });

        it('should be deterministic regardless of role order', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['roleA', 'roleB', 'roleC']
            };
            const roles1: RoleDefinition[] = [
                { id: 'roleA', name: 'A', permissions: ['perm1'] },
                { id: 'roleB', name: 'B', permissions: ['perm2'] },
                { id: 'roleC', name: 'C', permissions: ['perm3'] }
            ];
            const roles2: RoleDefinition[] = [
                { id: 'roleC', name: 'C', permissions: ['perm3'] },
                { id: 'roleA', name: 'A', permissions: ['perm1'] },
                { id: 'roleB', name: 'B', permissions: ['perm2'] }
            ];

            const granted1 = PermissionEngine.buildGrantedPermissions(session, roles1);
            const granted2 = PermissionEngine.buildGrantedPermissions(session, roles2);

            expect(granted1.size).toBe(granted2.size);
            expect(granted1.has('perm1')).toBe(granted2.has('perm1'));
            expect(granted1.has('perm2')).toBe(granted2.has('perm2'));
            expect(granted1.has('perm3')).toBe(granted2.has('perm3'));
        });
    });

    describe('can', () => {
        it('should return false for permission not in granted set (deny-by-default)', () => {
            const granted = new Set(['students.read']);

            expect(PermissionEngine.can('students.write', granted)).toBe(false);
        });

        it('should return true for permission in granted set', () => {
            const granted = new Set(['students.read', 'students.write']);

            expect(PermissionEngine.can('students.read', granted)).toBe(true);
            expect(PermissionEngine.can('students.write', granted)).toBe(true);
        });

        it('should return false for empty granted set', () => {
            const granted = new Set<string>();

            expect(PermissionEngine.can('students.read', granted)).toBe(false);
        });
    });

    describe('canAny', () => {
        it('should return false when no permissions match', () => {
            const granted = new Set(['students.read']);

            expect(PermissionEngine.canAny(['students.write', 'students.delete'], granted)).toBe(false);
        });

        it('should return true when at least one permission matches', () => {
            const granted = new Set(['students.read', 'fees.write']);

            expect(PermissionEngine.canAny(['students.read', 'students.write'], granted)).toBe(true);
        });

        it('should return true when all permissions match', () => {
            const granted = new Set(['students.read', 'students.write']);

            expect(PermissionEngine.canAny(['students.read', 'students.write'], granted)).toBe(true);
        });

        it('should return false for empty permissions array', () => {
            const granted = new Set(['students.read']);

            expect(PermissionEngine.canAny([], granted)).toBe(false);
        });
    });

    describe('canAll', () => {
        it('should return false when some permissions missing', () => {
            const granted = new Set(['students.read']);

            expect(PermissionEngine.canAll(['students.read', 'students.write'], granted)).toBe(false);
        });

        it('should return true when all permissions match', () => {
            const granted = new Set(['students.read', 'students.write', 'fees.read']);

            expect(PermissionEngine.canAll(['students.read', 'students.write'], granted)).toBe(true);
        });

        it('should return true for empty permissions array', () => {
            const granted = new Set(['students.read']);

            expect(PermissionEngine.canAll([], granted)).toBe(true);
        });

        it('should return false when no permissions granted', () => {
            const granted = new Set<string>();

            expect(PermissionEngine.canAll(['students.read'], granted)).toBe(false);
        });
    });
});
