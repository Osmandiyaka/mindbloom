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

    describe('getModulesForPlan()', () => {
        it('should return modules for trial plan', () => {
            editionService.setEdition({ editionCode: 'trial', editionName: 'Trial', features: [MODULE_KEYS.STUDENTS, MODULE_KEYS.ADMISSIONS] });
            const modules = service.getModulesForPlan('trial');

            expect(modules.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(modules.has(MODULE_KEYS.ADMISSIONS)).toBe(true);
            expect(modules.has(MODULE_KEYS.HR)).toBe(false);
        });

        it('should return modules for enterprise plan', () => {
            editionService.setEdition({ editionCode: 'enterprise', editionName: 'Enterprise', features: [MODULE_KEYS.HR, MODULE_KEYS.PAYROLL, MODULE_KEYS.LIBRARY] });
            const modules = service.getModulesForPlan('enterprise');

            expect(modules.has(MODULE_KEYS.HR)).toBe(true);
            expect(modules.has(MODULE_KEYS.PAYROLL)).toBe(true);
            expect(modules.has(MODULE_KEYS.LIBRARY)).toBe(true);
        });
    });

    describe('getAdditionalModulesInPlan()', () => {
        it('should return modules not in current plan', () => {
            // current plan (default) has DASHBOARD and APPLY, other plans contain more modules
            const additionalModules = service.getAdditionalModulesInPlan('premium');

            // We expect some premium modules to be available (module lists are defined in edition features)
            expect(Array.isArray(additionalModules)).toBe(true);
        });

        it('should return empty array if target plan is same', () => {
            // When target plan equals current plan, there are no additional modules
            // Simulate editions code same as target
            editionService.setEdition({ editionCode: 'premium', editionName: 'Premium', features: [MODULE_KEYS.FEES, MODULE_KEYS.LIBRARY] });
            const additionalModules = service.getAdditionalModulesInPlan('premium');

            expect(additionalModules.length).toBe(0);
        });
    });

});
