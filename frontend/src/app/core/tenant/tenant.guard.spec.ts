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
import { EditionService } from '../../shared/services/entitlements.service';
import { of } from 'rxjs';

describe('TenantGuard', () => {
    let tenantContextService: jasmine.SpyObj<TenantContextService>;
    let router: jasmine.SpyObj<Router>;
    let authService: jasmine.SpyObj<AuthService>;
    let entitlementsService: jasmine.SpyObj<EditionService>;
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
        // Create spies
        tenantContextService = jasmine.createSpyObj('TenantContextService', ['hasTenant']);
        router = jasmine.createSpyObj('Router', ['createUrlTree']);
        authService = jasmine.createSpyObj('AuthService', ['getSession']);
        authService.getSession.and.returnValue(null);
        entitlementsService = jasmine.createSpyObj('EditionService', ['loadEntitlements']);
        entitlementsService.loadEntitlements.and.returnValue(of({
            tenantId: 't-1',
            edition: { code: 'free', displayName: 'Free', version: 1 },
            modules: {},
            features: {},
            requiresEditionSelection: false,
        } as any));

        // Setup TestBed
        TestBed.configureTestingModule({
            providers: [
                { provide: TenantContextService, useValue: tenantContextService },
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: authService },
                { provide: EditionService, useValue: entitlementsService }
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

    it('should allow public routes', async () => {
        // Arrange
        mockRoute.data = { public: true };

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should allow routes with skipTenant flag', async () => {
        // Arrange
        mockRoute.data = { skipTenant: true };

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should allow tenant routes when tenant context exists', async () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        tenantContextService.hasTenant.and.returnValue(true);

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).toHaveBeenCalled();
    });

    it('should route host sessions to /host when no tenant context', async () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        mockState.url = '/dashboard';
        authService.getSession.and.returnValue({ mode: 'host', memberships: [], user: { id: 'u', email: 'u@example.com' }, tokens: { accessToken: 't' }, expiresAt: '2025-01-01T00:00:00Z' } as any);

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(expectedUrlTree);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/host']);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should allow tenant routes when tenant context is missing', async () => {
        // Arrange
        mockRoute.data = {}; // Protected route
        mockState.url = '/students';
        tenantContextService.hasTenant.and.returnValue(false);

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).toHaveBeenCalled();
    });

    it('should not call hasTenant for public routes even if data has other properties', async () => {
        // Arrange
        mockRoute.data = {
            public: true,
            permissions: ['students.read']
        };

        // Act
        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        // Assert
        expect(result).toBe(true);
        expect(tenantContextService.hasTenant).not.toHaveBeenCalled();
    });

    it('should redirect to onboarding when edition is missing', async () => {
        mockRoute.data = {};
        mockState.url = '/dashboard';
        tenantContextService.hasTenant.and.returnValue(true);
        entitlementsService.loadEntitlements.and.returnValue(of({
            tenantId: 't-1',
            edition: null,
            modules: {},
            features: {},
            requiresEditionSelection: true,
        } as any));

        const expectedUrlTree = new UrlTree();
        router.createUrlTree.and.returnValue(expectedUrlTree);

        const result = await TestBed.runInInjectionContext(() =>
            tenantGuard(mockRoute, mockState)
        );

        expect(result).toBe(expectedUrlTree);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding']);
    });
});
