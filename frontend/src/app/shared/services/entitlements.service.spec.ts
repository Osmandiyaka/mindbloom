import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EntitlementsService } from './entitlements.service';
import { TenantService, TenantPlan } from '../../core/services/tenant.service';
import { MODULE_KEYS } from '../types/module-keys';
import { of } from 'rxjs';

describe('EntitlementsService', () => {
    let service: EntitlementsService;
    let tenantService: jasmine.SpyObj<TenantService>;

    const mockTenant = (plan: TenantPlan) => ({
        id: 'test-tenant-id',
        name: 'Test School',
        subdomain: 'test',
        status: 'active' as const,
        plan: plan,
        contactInfo: { email: 'test@test.com' }
    });

    beforeEach(() => {
        tenantService = jasmine.createSpyObj('TenantService', [
            'getCurrentTenantValue',
            'getTenantById',
            'setTenant'
        ], {
            currentTenant: jasmine.createSpy().and.returnValue(null),
            currentTenant$: of(null)
        });

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                EntitlementsService,
                { provide: TenantService, useValue: tenantService }
            ]
        });

        service = TestBed.inject(EntitlementsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('enabledModules()', () => {
        it('should return only dashboard when no tenant', () => {
            tenantService.currentTenant.and.returnValue(null);

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.size).toBe(1);
        });

        it('should return trial modules for trial plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('trial'));

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ADMISSIONS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ACADEMICS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ATTENDANCE)).toBe(true);
            expect(enabled.has(MODULE_KEYS.SETUP)).toBe(true);
            expect(enabled.has(MODULE_KEYS.HR)).toBe(false);
            expect(enabled.has(MODULE_KEYS.LIBRARY)).toBe(false);
        });

        it('should return free modules for free plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('free'));

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.SETUP)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ADMISSIONS)).toBe(false);
            expect(enabled.has(MODULE_KEYS.FEES)).toBe(false);
        });

        it('should return basic modules for basic plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('basic'));

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ADMISSIONS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ACADEMICS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ATTENDANCE)).toBe(true);
            expect(enabled.has(MODULE_KEYS.FINANCE)).toBe(false);
        });

        it('should return premium modules for premium plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('premium'));

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.FEES)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ACCOUNTING)).toBe(true);
            expect(enabled.has(MODULE_KEYS.FINANCE)).toBe(true);
            expect(enabled.has(MODULE_KEYS.LIBRARY)).toBe(true);
            expect(enabled.has(MODULE_KEYS.HR)).toBe(false);
            expect(enabled.has(MODULE_KEYS.PAYROLL)).toBe(false);
        });

        it('should return all modules for enterprise plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('enterprise'));

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.HR)).toBe(true);
            expect(enabled.has(MODULE_KEYS.PAYROLL)).toBe(true);
            expect(enabled.has(MODULE_KEYS.LIBRARY)).toBe(true);
            expect(enabled.has(MODULE_KEYS.HOSTEL)).toBe(true);
            expect(enabled.has(MODULE_KEYS.TRANSPORT)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ROLES)).toBe(true);
        });

        it('should use custom enabledModules if provided', () => {
            const customTenant = {
                ...mockTenant('trial'),
                enabledModules: ['dashboard', 'students', 'library']
            };
            tenantService.currentTenant.and.returnValue(customTenant);

            const enabled = service.enabledModules();

            expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
            expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(enabled.has(MODULE_KEYS.LIBRARY)).toBe(true);
            expect(enabled.has(MODULE_KEYS.ADMISSIONS)).toBe(false);
        });
    });

    describe('isEnabled()', () => {
        it('should return true for enabled module', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('premium'));

            expect(service.isEnabled(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(service.isEnabled(MODULE_KEYS.FEES)).toBe(true);
        });

        it('should return false for disabled module', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('basic'));

            expect(service.isEnabled(MODULE_KEYS.HR)).toBe(false);
            expect(service.isEnabled(MODULE_KEYS.LIBRARY)).toBe(false);
        });

        it('should return false when no tenant', () => {
            tenantService.currentTenant.and.returnValue(null);

            expect(service.isEnabled(MODULE_KEYS.STUDENTS)).toBe(false);
        });
    });

    describe('isEnabled$()', () => {
        it('should emit true for enabled module', (done) => {
            const tenant = mockTenant('premium');
            tenantService.currentTenant$ = of(tenant);

            service.isEnabled$(MODULE_KEYS.STUDENTS).subscribe(result => {
                expect(result).toBe(true);
                done();
            });
        });

        it('should emit false for disabled module', (done) => {
            const tenant = mockTenant('basic');
            tenantService.currentTenant$ = of(tenant);

            service.isEnabled$(MODULE_KEYS.HR).subscribe(result => {
                expect(result).toBe(false);
                done();
            });
        });

        it('should emit false when no tenant', (done) => {
            tenantService.currentTenant$ = of(null);

            service.isEnabled$(MODULE_KEYS.STUDENTS).subscribe(result => {
                expect(result).toBe(false);
                done();
            });
        });
    });

    describe('getCurrentPlan()', () => {
        it('should return current plan', () => {
            tenantService.getCurrentTenantValue.and.returnValue(mockTenant('premium'));

            expect(service.getCurrentPlan()).toBe('premium');
        });

        it('should return null when no tenant', () => {
            tenantService.getCurrentTenantValue.and.returnValue(null);

            expect(service.getCurrentPlan()).toBeNull();
        });
    });

    describe('isPlanIncluded()', () => {
        it('should check plan-based entitlements only', () => {
            tenantService.getCurrentTenantValue.and.returnValue(mockTenant('premium'));

            expect(service.isPlanIncluded(MODULE_KEYS.LIBRARY)).toBe(true);
            expect(service.isPlanIncluded(MODULE_KEYS.HR)).toBe(false);
        });

        it('should return false when no tenant', () => {
            tenantService.getCurrentTenantValue.and.returnValue(null);

            expect(service.isPlanIncluded(MODULE_KEYS.STUDENTS)).toBe(false);
        });
    });

    describe('getModulesForPlan()', () => {
        it('should return modules for trial plan', () => {
            const modules = service.getModulesForPlan('trial');

            expect(modules.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(modules.has(MODULE_KEYS.ADMISSIONS)).toBe(true);
            expect(modules.has(MODULE_KEYS.HR)).toBe(false);
        });

        it('should return modules for enterprise plan', () => {
            const modules = service.getModulesForPlan('enterprise');

            expect(modules.has(MODULE_KEYS.HR)).toBe(true);
            expect(modules.has(MODULE_KEYS.PAYROLL)).toBe(true);
            expect(modules.has(MODULE_KEYS.LIBRARY)).toBe(true);
        });
    });

    describe('getAdditionalModulesInPlan()', () => {
        it('should return modules not in current plan', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('basic'));

            const additionalModules = service.getAdditionalModulesInPlan('premium');

            expect(additionalModules).toContain(MODULE_KEYS.FEES);
            expect(additionalModules).toContain(MODULE_KEYS.LIBRARY);
            expect(additionalModules).toContain(MODULE_KEYS.FINANCE);
            expect(additionalModules).not.toContain(MODULE_KEYS.STUDENTS);
        });

        it('should return empty array if target plan is same', () => {
            tenantService.currentTenant.and.returnValue(mockTenant('premium'));

            const additionalModules = service.getAdditionalModulesInPlan('premium');

            expect(additionalModules.length).toBe(0);
        });
    });

    describe('refresh()', () => {
        it('should refresh tenant and update entitlements', async () => {
            const initialTenant = mockTenant('basic');
            const updatedTenant = mockTenant('premium');

            tenantService.getCurrentTenantValue.and.returnValue(initialTenant);
            tenantService.getTenantById.and.returnValue(of(updatedTenant));

            await service.refresh();

            expect(tenantService.getTenantById).toHaveBeenCalledWith(initialTenant.id);
            expect(tenantService.setTenant).toHaveBeenCalledWith(updatedTenant);
        });

        it('should handle no active tenant', async () => {
            tenantService.getCurrentTenantValue.and.returnValue(null);

            await expectAsync(service.refresh()).toBeResolved();
            expect(tenantService.getTenantById).not.toHaveBeenCalled();
        });
    });
});
