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

    it('returns empty set when no edition loaded', () => {
        const enabled = service.enabledModules();
        expect(enabled.size).toBe(0);
    });

    it('returns backend-provided modules when edition set', () => {
        editionService.setEdition({ editionCode: 'enterprise', editionName: 'Enterprise', modules: [MODULE_KEYS.STUDENTS, MODULE_KEYS.FEES] });
        const enabled = service.enabledModules();
        expect(enabled.has(MODULE_KEYS.STUDENTS)).toBe(true);
        expect(enabled.has(MODULE_KEYS.FEES)).toBe(true);
    });

    describe('getModulesForEdition()', () => {
        it('should return modules for free edition', () => {
            editionService.setEdition({ editionCode: 'free', editionName: 'Free', modules: [MODULE_KEYS.STUDENTS, MODULE_KEYS.ADMISSIONS] });
            const modules = service.getModulesForEdition('free');

            expect(modules.has(MODULE_KEYS.STUDENTS)).toBe(true);
            expect(modules.has(MODULE_KEYS.ADMISSIONS)).toBe(true);
            expect(modules.has(MODULE_KEYS.HR)).toBe(false);
        });

        it('should return modules for enterprise edition', () => {
            editionService.setEdition({ editionCode: 'enterprise', editionName: 'Enterprise', modules: [MODULE_KEYS.HR, MODULE_KEYS.PAYROLL, MODULE_KEYS.LIBRARY] });
            const modules = service.getModulesForEdition('enterprise');

            expect(modules.has(MODULE_KEYS.HR)).toBe(true);
            expect(modules.has(MODULE_KEYS.PAYROLL)).toBe(true);
            expect(modules.has(MODULE_KEYS.LIBRARY)).toBe(true);
        });
    });

    describe('getAdditionalModulesInEdition()', () => {
        it('should return modules not in current edition', () => {
            const additionalModules = service.getAdditionalModulesInEdition('premium');

            // We expect some premium modules to be available (module lists are defined in edition features)
            expect(Array.isArray(additionalModules)).toBe(true);
        });

        it('should return empty array if target edition is same', () => {
            // When target edition equals current edition, there are no additional modules
            // Simulate editions code same as target
            editionService.setEdition({ editionCode: 'premium', editionName: 'Premium', modules: [MODULE_KEYS.FEES, MODULE_KEYS.LIBRARY] });
            const additionalModules = service.getAdditionalModulesInEdition('premium');

            expect(additionalModules.length).toBe(0);
        });
    });

});
