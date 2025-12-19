/**
 * Unit tests for RbacService
 * 
 * Tests Angular service integration:
 * - Session and role management
 * - Reactive permission computation
 * - Synchronous and observable APIs
 */

import { TestBed } from '@angular/core/testing';
import { RbacService } from './rbac.service';
import { RoleDefinition, UserSession } from './permissions.types';

describe('RbacService', () => {
    let service: RbacService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RbacService);
    });

    afterEach(() => {
        service.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('deny-by-default', () => {
        it('should deny all permissions when session is null', () => {
            expect(service.can('students.read')).toBe(false);
            expect(service.can('students.write')).toBe(false);
        });

        it('should deny all permissions when session has no roles', () => {
            service.setSession({
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: []
            });

            expect(service.can('students.read')).toBe(false);
        });

        it('should deny permission not in any role', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            expect(service.can('students.read')).toBe(true);
            expect(service.can('students.write')).toBe(false);
        });
    });

    describe('allow by explicit grant', () => {
        it('should allow permission granted by role', () => {
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

            service.setSession(session);
            service.setRoles(roles);

            expect(service.can('students.read')).toBe(true);
            expect(service.can('attendance.mark')).toBe(true);
        });
    });

    describe('multiple roles aggregation', () => {
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

            service.setSession(session);
            service.setRoles(roles);

            expect(service.can('students.read')).toBe(true);
            expect(service.can('library.issue')).toBe(true);
        });

        it('should handle overlapping permissions correctly', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['roleA', 'roleB']
            };
            const roles: RoleDefinition[] = [
                { id: 'roleA', name: 'A', permissions: ['students.read', 'fees.read'] },
                { id: 'roleB', name: 'B', permissions: ['students.read', 'library.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            const granted = service.grantedPermissions();
            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('fees.read')).toBe(true);
            expect(granted.has('library.read')).toBe(true);
            expect(granted.size).toBe(3); // No duplicates
        });
    });

    describe('determinism', () => {
        it('should produce same result regardless of role definition order', (done) => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['roleA', 'roleB']
            };

            // First order
            const roles1: RoleDefinition[] = [
                { id: 'roleA', name: 'A', permissions: ['perm1'] },
                { id: 'roleB', name: 'B', permissions: ['perm2'] }
            ];
            service.setSession(session);
            service.setRoles(roles1);
            const result1 = service.can('perm1') && service.can('perm2');

            // Different order
            const roles2: RoleDefinition[] = [
                { id: 'roleB', name: 'B', permissions: ['perm2'] },
                { id: 'roleA', name: 'A', permissions: ['perm1'] }
            ];
            service.setRoles(roles2);
            const result2 = service.can('perm1') && service.can('perm2');

            expect(result1).toBe(result2);
            expect(result1).toBe(true);
            done();
        });
    });

    describe('canAny', () => {
        it('should return true if user has at least one permission', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            expect(service.canAny(['students.read', 'students.write'])).toBe(true);
        });

        it('should return false if user has none of the permissions', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            expect(service.canAny(['students.write', 'students.delete'])).toBe(false);
        });
    });

    describe('canAll', () => {
        it('should return true if user has all permissions', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read', 'students.write'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            expect(service.canAll(['students.read', 'students.write'])).toBe(true);
        });

        it('should return false if user is missing any permission', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            expect(service.canAll(['students.read', 'students.write'])).toBe(false);
        });
    });

    describe('reactive API', () => {
        it('should emit permission changes via can$', (done) => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            // Set roles first, then session to trigger single emission
            service.setRoles(roles);

            service.can$('students.read').subscribe(canRead => {
                if (canRead) {
                    expect(canRead).toBe(true);
                    done();
                }
            });

            // Trigger emission by setting session
            service.setSession(session);
        });

        it('should update observable when session changes', (done) => {
            const initialSession: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['parent']
            };
            const roles: RoleDefinition[] = [
                { id: 'parent', name: 'Parent', permissions: ['students.read'] },
                { id: 'teacher', name: 'Teacher', permissions: ['students.read', 'students.write'] }
            ];

            service.setRoles(roles);
            service.setSession(initialSession);

            const results: boolean[] = [];
            service.can$('students.write').subscribe(can => {
                results.push(can);
                if (results.length === 2) {
                    expect(results[0]).toBe(false); // Parent doesn't have write
                    expect(results[1]).toBe(true);  // Teacher has write
                    done();
                }
            });

            // Change session after initial subscription
            setTimeout(() => {
                const newSession: UserSession = {
                    userId: 'user1',
                    tenantId: 'tenant1',
                    roleIds: ['teacher']
                };
                service.setSession(newSession);
            }, 10);
        });
    });

    describe('clear', () => {
        it('should clear session and roles', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read'] }
            ];

            service.setSession(session);
            service.setRoles(roles);
            expect(service.can('students.read')).toBe(true);

            service.clear();
            expect(service.can('students.read')).toBe(false);
            expect(service.getSession()).toBeNull();
            expect(service.getRoles()).toEqual([]);
        });
    });

    describe('grantedPermissions', () => {
        it('should return readonly set of current permissions', () => {
            const session: UserSession = {
                userId: 'user1',
                tenantId: 'tenant1',
                roleIds: ['teacher']
            };
            const roles: RoleDefinition[] = [
                { id: 'teacher', name: 'Teacher', permissions: ['students.read', 'attendance.mark'] }
            ];

            service.setSession(session);
            service.setRoles(roles);

            const granted = service.grantedPermissions();
            expect(granted.size).toBe(2);
            expect(granted.has('students.read')).toBe(true);
            expect(granted.has('attendance.mark')).toBe(true);
        });
    });
});
