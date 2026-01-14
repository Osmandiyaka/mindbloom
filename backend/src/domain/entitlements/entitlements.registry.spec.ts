import { getCanonicalEditionByCode, listCanonicalEditions, validateEntitlementsRegistry } from './entitlements.registry';

describe('entitlements registry', () => {
    it('validates canonical editions', () => {
        expect(() => validateEntitlementsRegistry()).not.toThrow();
    });

    it('returns editions sorted by sortOrder', () => {
        const editions = listCanonicalEditions();
        expect(editions.length).toBeGreaterThan(0);
        expect(editions[0].sortOrder).toBeLessThanOrEqual(editions[editions.length - 1].sortOrder);
    });

    it('resolves editions by code', () => {
        const edition = getCanonicalEditionByCode('enterprise');
        expect(edition?.code).toBe('enterprise');
    });
});
