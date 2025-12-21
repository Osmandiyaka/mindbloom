/**
 * Unit tests for TenantGuard
 * 
 * Tests guard behavior for:
 * - Public routes (should allow)
 * - Tenant routes with context (should allow)
 * - Tenant routes without context (should block and redirect)
 * - Routes with skipTenant flag (should allow)
 */

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { tenantGuard } from './tenant.guard';
import { TenantContextService } from './tenant-context.service';
import { AuthService } from '../auth/auth.service';
import { TenantMembership } from '../auth/auth.models';

describe('TenantGuard', () => {
    let tenantContextService: jasmine.SpyObj<TenantContextService>;
    let router: jasmine.SpyObj<Router>;
    let authService: jasmine.SpyObj<AuthService>;
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
        // Create spies
        tenantContextService = jasmine.createSpyObj('TenantContextService', ['hasTenant']);
        router = jasmine.createSpyObj('Router', ['createUrlTree']);
        authService = jasmine.createSpyObj('AuthService', ['getSession']);
        authService.getSession.and.returnValue(null);

        // Setup TestBed
        TestBed.configureTestingModule({
            providers: [
                { provide: TenantContextService, useValue: tenantContextService },
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: authService }
            ]
        });

        // Create mock route and state
        mockRoute = {
            data: {}
        } as any;

        mockState = {
            url: '/dashboard'
        } as any;
    });

    it('should allow public routes', () => {
        // Arrange
        mockRoute.data = { public: true };

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should allow routes with skipTenant flag', () => {
        // Arrange
        mockRoute.data = { skipTenant: true };

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should allow tenant routes when tenant context exists', () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        tenantContextService.hasTenant.and.returnValue(true);

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).toHaveBeenCalled();
    });

    it('should route host sessions to /host when no tenant context', () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        mockState.url = '/dashboard';
        authService.getSession.and.returnValue({ mode: 'host', memberships: [], user: { id: 'u', email: 'u@example.com' }, tokens: { accessToken: 't' }, expiresAt: '2025-01-01T00:00:00Z' } as any);

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(expectedUrlTree);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/host']);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should block tenant routes when tenant context is missing', () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        mockState.url = '/students';
        tenantContextService.hasTenant.and.returnValue(false);

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(expectedUrlTree);
        expect(tenantContextService.hasTenant).toHaveBeenCalled();
        expect(router.createUrlTree).toHaveBeenCalledWith(['/select-school'], {
            queryParams: { returnUrl: '/students' }
        });
    });

    it('should include returnUrl in redirect when tenant missing', () => {
        // Arrange
        mockRoute.data = {};
        mockState.url = '/students/list';
        tenantContextService.hasTenant.and.returnValue(false);

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(router.createUrlTree).toHaveBeenCalledWith(['/select-school'], {
            queryParams: { returnUrl: '/students/list' }
        });
    });

    it('should not call hasTenant for public routes even if data has other properties', () => {
        // Arrange
        mockRoute.data = {
            public: true,
            permissions: ['students.read']
        };

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should handle root path redirect when tenant missing', () => {
        // Arrange
        mockRoute.data = {};
        mockState.url = '/';
        tenantContextService.hasTenant.and.returnValue(false);

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        // Act
        const result = TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(router.createUrlTree).toHaveBeenCalledWith(['/select-school'], {
            queryParams: { returnUrl: '/' }
        });
    });
});
