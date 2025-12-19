import { TestBed } from '@angular/core/testing';
import { EditionService } from './entitlements.service';
import { EditionFeaturesService } from './edition-features.service';
import { MODULE_KEYS } from '../types/module-keys';

describe('EditionService', () => {
    let service: EditionService;
    let editionService: EditionFeaturesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EditionService, EditionFeaturesService],
        });

        service = TestBed.inject(EditionService);
        editionService = TestBed.inject(EditionFeaturesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('returns minimal surface when no edition loaded', () => {
        const enabled = service.enabledModules();
        expect(enabled.has(MODULE_KEYS.DASHBOARD)).toBe(true);
        expect(enabled.has(MODULE_KEYS.APPLY)).toBe(true);
    });

    it('returns backend-provided features when edition set', () => {
        editionService.setEdition({ editionCode: 'enterprise', editionName: 'Enterprise', features: [MODULE_KEYS.STUDENTS, MODULE_KEYS.FEES] });
        const enabled = service.enabledModules();
        expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
        expect(enabled.has(MODULE_KEYS.FEES)).toBe(true);
        expect(enabled.has(MODULE_KEYS.APPLY)).toBe(false);
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
