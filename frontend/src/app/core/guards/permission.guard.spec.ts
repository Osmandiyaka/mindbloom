/**
 * Unit tests for Permission Guard
 * 
 * Tests both CanActivateFn and CanMatchFn implementations
 */

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { permissionGuard, permissionMatchGuard } from './permission.guard';
import { AuthService } from '../auth/auth.service';

describe('Permission Guards', () => {
    let router: jasmine.SpyObj<Router>;
    let authService: jasmine.SpyObj<AuthService>;
    let mockUrlTree: UrlTree;

    beforeEach(() => {
        // Create spies
        mockUrlTree = {} as UrlTree;
        router = jasmine.createSpyObj('Router', ['createUrlTree']);
        router.createUrlTree.and.returnValue(mockUrlTree);

        authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

        TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: authService }
            ]
        });
    });

    describe('permissionGuard (CanActivate)', () => {
        let route: ActivatedRouteSnapshot;
        let state: RouterStateSnapshot;

        beforeEach(() => {
            route = { data: {} } as ActivatedRouteSnapshot;
            state = { url: '/students/new' } as RouterStateSnapshot;
        });

        it('should allow access when no permissions are specified', () => {
            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(true);
        });

        it('should redirect to login when user is not authenticated', () => {
            route.data = { permissions: ['students:create'] };
            authService.getCurrentUser.and.returnValue(null);
            router.createUrlTree.and.returnValue(mockUrlTree);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(mockUrlTree);
            expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
                queryParams: { returnUrl: '/students/new' }
            });
        });

        it('should allow access for Host Admin', () => {
            route.data = { permissions: ['students:create'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'admin@test.com',
                role: { name: 'Host Admin' }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(true);
        });

        it('should allow access when user has required permission', () => {
            route.data = { permissions: ['students:create'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'teacher@test.com',
                role: {
                    name: 'Teacher',
                    permissions: [
                        { resource: 'students', actions: ['create', 'read'] }
                    ]
                }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(true);
        });

        it('should allow access when user has manage permission', () => {
            route.data = { permissions: ['students:delete'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'admin@test.com',
                role: {
                    name: 'Admin',
                    permissions: [
                        { resource: 'students', actions: ['manage'] }
                    ]
                }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(true);
        });

        it('should redirect to access-denied when user lacks permission', () => {
            route.data = { permissions: ['students:delete'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'user@test.com',
                role: {
                    name: 'User',
                    permissions: [
                        { resource: 'students', actions: ['read'] }
                    ]
                }
            } as any);
            router.createUrlTree.and.returnValue(mockUrlTree);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(mockUrlTree);
            expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied'], {
                queryParams: { from: '/students/new' }
            });
        });

        it('should require ALL permissions when multiple are specified', () => {
            route.data = { permissions: ['students:create', 'students:update'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'user@test.com',
                role: {
                    name: 'User',
                    permissions: [
                        { resource: 'students', actions: ['create'] }
                        // Missing 'update' action
                    ]
                }
            } as any);
            router.createUrlTree.and.returnValue(mockUrlTree);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(mockUrlTree);
        });

        it('should allow when user has all required permissions', () => {
            route.data = { permissions: ['students:create', 'students:update'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'admin@test.com',
                role: {
                    name: 'Admin',
                    permissions: [
                        { resource: 'students', actions: ['create', 'update', 'read'] }
                    ]
                }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionGuard(route, state)
            );

            expect(result).toBe(true);
        });
    });

    describe('permissionMatchGuard (CanMatch)', () => {
        let route: any;
        let segments: UrlSegment[];

        beforeEach(() => {
            route = { data: {} };
            segments = [
                { path: 'students', parameters: {} } as UrlSegment,
                { path: 'new', parameters: {} } as UrlSegment
            ];
        });

        it('should allow when no permissions are specified', () => {
            const result = TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(result).toBe(true);
        });

        it('should redirect to login when user is not authenticated', () => {
            route.data = { permissions: ['students:read'] };
            authService.getCurrentUser.and.returnValue(null);
            router.createUrlTree.and.returnValue(mockUrlTree);

            const result = TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(result).toBe(mockUrlTree);
            expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
                queryParams: { returnUrl: '/students/new' }
            });
        });

        it('should allow access for Host Admin', () => {
            route.data = { permissions: ['students:read'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'admin@test.com',
                role: { name: 'Host Admin' }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(result).toBe(true);
        });

        it('should allow when user has required permission', () => {
            route.data = { permissions: ['students:read'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'teacher@test.com',
                role: {
                    name: 'Teacher',
                    permissions: [
                        { resource: 'students', actions: ['read'] }
                    ]
                }
            } as any);

            const result = TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(result).toBe(true);
        });

        it('should redirect to access-denied when user lacks permission', () => {
            route.data = { permissions: ['students:read'] };
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'user@test.com',
                role: {
                    name: 'User',
                    permissions: [
                        { resource: 'fees', actions: ['read'] }
                    ]
                }
            } as any);
            router.createUrlTree.and.returnValue(mockUrlTree);

            const result = TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(result).toBe(mockUrlTree);
            expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied'], {
                queryParams: { from: '/students/new' }
            });
        });

        it('should build attempted URL from segments', () => {
            route.data = { permissions: ['fees:read'] };
            segments = [
                { path: 'fees', parameters: {} } as UrlSegment,
                { path: 'invoices', parameters: {} } as UrlSegment,
                { path: '123', parameters: {} } as UrlSegment
            ];
            authService.getCurrentUser.and.returnValue({
                id: '1',
                email: 'user@test.com',
                role: {
                    name: 'User',
                    permissions: []
                }
            } as any);
            router.createUrlTree.and.returnValue(mockUrlTree);

            TestBed.runInInjectionContext(() =>
                permissionMatchGuard(route, segments)
            );

            expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied'], {
                queryParams: { from: '/fees/invoices/123' }
            });
        });
    });
});
