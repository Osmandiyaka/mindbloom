import { createGlobalEditionFeatureAssignments } from './system-edition-features';

describe('createGlobalEditionFeatureAssignments', () => {
    it('returns assignments for canonical editions', () => {
        const map = createGlobalEditionFeatureAssignments();
        expect(map.starter).toBeDefined();
        expect(map.professional).toBeDefined();
        expect(map.premium).toBeDefined();
        expect(map.enterprise).toBeDefined();

        // spot-check some features
        expect(map.starter.some(f => f.featureKey === 'students')).toBeTruthy();
        expect(map.professional.some(f => f.featureKey === 'api_access')).toBeTruthy();
        expect(map.premium.some(f => f.featureKey === 'analytics')).toBeTruthy();
        expect(map.enterprise.some(f => f.featureKey === 'sso')).toBeTruthy();

        // support level exists for each
        for (const name of ['starter', 'professional', 'premium', 'enterprise']) {
            const hasSupport = map[name].some(f => f.featureKey === 'support_level');
            expect(hasSupport).toBeTruthy();
        }
    });
});
