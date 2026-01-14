import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, Route, UrlSegment } from '@angular/router';
import { moduleEntitlementGuard } from './module-entitlement.guard';
import { EditionService } from '../services/entitlements.service';
import { MODULE_KEYS } from '../types/module-keys';
import { Observable, firstValueFrom, of } from 'rxjs';

const defaultSnapshot = {
    tenantId: 't-1',
    edition: { code: 'professional', displayName: 'Professional', version: 1 },
    modules: {
        dashboard: true,
        students: true,
        admissions: true,
        apply: true,
        academics: true,
        attendance: true,
        fees: true,
        accounting: true,
        finance: true,
        hr: true,
        payroll: true,
        library: true,
        hostel: true,
        transport: true,
        roles: true,
        tasks: true,
        setup: true,
        plugins: true,
    },
    features: {},
    requiresEditionSelection: false,
};

describe('moduleEntitlementGuard', () => {
    let entitlementsService: jasmine.SpyObj<EditionService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {
        entitlementsService = jasmine.createSpyObj('EditionService', ['isEnabled', 'loadEntitlements']);
        router = jasmine.createSpyObj('Router', ['createUrlTree']);
        entitlementsService.loadEntitlements.and.returnValue(of(defaultSnapshot as any));

        TestBed.configureTestingModule({
            providers: [
                { provide: EditionService, useValue: entitlementsService },
                { provide: Router, useValue: router }
            ]
        });
    });

    async function resolveGuard(result: boolean | UrlTree | Observable<boolean | UrlTree>): Promise<boolean | UrlTree> {
        if (result instanceof Observable) {
            return firstValueFrom(result);
        }
        return result;
    }

    it('should allow access when no moduleKey specified', async () => {
        const route: Route = {
            path: 'test',
            data: {}
        };
        const segments: UrlSegment[] = [];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(result).toBe(true);
    });

    it('should allow access when module is enabled', async () => {
        entitlementsService.isEnabled.and.returnValue(true);

        const route: Route = {
            path: 'students',
            data: { moduleKey: MODULE_KEYS.STUDENTS }
        };
        const segments: UrlSegment[] = [];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(entitlementsService.isEnabled).toHaveBeenCalledWith(MODULE_KEYS.STUDENTS);
        expect(result).toBe(true);
    });

    it('should deny access when module is disabled', async () => {
        entitlementsService.isEnabled.and.returnValue(false);
        const urlTree = new UrlTree();
        router.createUrlTree.and.returnValue(urlTree);

        const route: Route = {
            path: 'hr',
            data: { moduleKey: MODULE_KEYS.HR }
        };
        const segments: UrlSegment[] = [
            { path: 'hr', parameters: {} } as UrlSegment
        ];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(entitlementsService.isEnabled).toHaveBeenCalledWith(MODULE_KEYS.HR);
        expect(router.createUrlTree).toHaveBeenCalledWith(
            ['/module-not-enabled'],
            {
                queryParams: {
                    module: MODULE_KEYS.HR,
                    returnUrl: '/hr'
                }
            }
        );
        expect(result).toBe(urlTree);
    });

    it('should include correct returnUrl for nested paths', async () => {
        entitlementsService.isEnabled.and.returnValue(false);
        const urlTree = new UrlTree();
        router.createUrlTree.and.returnValue(urlTree);

        const route: Route = {
            path: 'library',
            data: { moduleKey: MODULE_KEYS.LIBRARY }
        };
        const segments: UrlSegment[] = [
            { path: 'library', parameters: {} } as UrlSegment,
            { path: 'books', parameters: {} } as UrlSegment,
            { path: 'add', parameters: {} } as UrlSegment
        ];

        await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(router.createUrlTree).toHaveBeenCalledWith(
            ['/module-not-enabled'],
            {
                queryParams: {
                    module: MODULE_KEYS.LIBRARY,
                    returnUrl: '/library/books/add'
                }
            }
        );
    });

    it('should handle attendance module', async () => {
        entitlementsService.isEnabled.and.returnValue(false);
        const urlTree = new UrlTree();
        router.createUrlTree.and.returnValue(urlTree);

        const route: Route = {
            path: 'attendance',
            data: { moduleKey: MODULE_KEYS.ATTENDANCE }
        };
        const segments: UrlSegment[] = [
            { path: 'attendance', parameters: {} } as UrlSegment
        ];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(entitlementsService.isEnabled).toHaveBeenCalledWith(MODULE_KEYS.ATTENDANCE);
        expect(result).toBe(urlTree);
    });

    it('should handle fees module', async () => {
        entitlementsService.isEnabled.and.returnValue(true);

        const route: Route = {
            path: 'fees',
            data: { moduleKey: MODULE_KEYS.FEES }
        };
        const segments: UrlSegment[] = [];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(entitlementsService.isEnabled).toHaveBeenCalledWith(MODULE_KEYS.FEES);
        expect(result).toBe(true);
    });

    it('should allow plugins module when enabled', async () => {
        entitlementsService.isEnabled.and.returnValue(true);

        const route: Route = {
            path: 'plugins',
            data: { moduleKey: MODULE_KEYS.PLUGINS }
        };
        const segments: UrlSegment[] = [];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(result).toBe(true);
    });

    it('should deny setup module when disabled', async () => {
        entitlementsService.isEnabled.and.returnValue(false);
        const urlTree = new UrlTree();
        router.createUrlTree.and.returnValue(urlTree);

        const route: Route = {
            path: 'setup',
            data: { moduleKey: MODULE_KEYS.SETUP }
        };
        const segments: UrlSegment[] = [];

        const result = await resolveGuard(TestBed.runInInjectionContext(() =>
            moduleEntitlementGuard(route, segments)
        ));

        expect(result).toBe(urlTree);
    });
});
