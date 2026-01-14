import { EditionsController } from './editions.controller';

describe('EditionsController', () => {
    it('returns active editions with features sorted by sortOrder', async () => {
        const ctrl = new EditionsController();
        const res = await ctrl.listPublic() as any[];
        expect(res.length).toBeGreaterThan(0);
        expect(res[0].sortOrder).toBeLessThanOrEqual(res[res.length - 1].sortOrder);
        expect(res.every((r: any) => r.features)).toBeTruthy();
        expect(res.find((r: any) => r.name === 'free')).toBeTruthy();
        expect(res.find((r: any) => r.name === 'enterprise')).toBeTruthy();
    });
});
