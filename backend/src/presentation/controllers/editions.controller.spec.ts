import { EditionsController } from './editions.controller';

describe('EditionsController', () => {
    it('returns active editions with features sorted by sortOrder', async () => {
        const fakeData = [
            { edition: { id: '1', name: 'b', displayName: 'B', description: '', isActive: true, sortOrder: 20 }, features: { a: '1' } },
            { edition: { id: '2', name: 'a', displayName: 'A', description: '', isActive: true, sortOrder: 10 }, features: { b: '1' } },
            { edition: { id: '3', name: 'c', displayName: 'C', description: '', isActive: false, sortOrder: 30 }, features: { c: '1' } },
        ] as any;

        const manager = { listEditionsWithFeatures: jest.fn().mockResolvedValue(fakeData) } as any;
        const ctrl = new EditionsController(manager);

        const res = await ctrl.listPublic() as any[];
        expect(res.length).toBe(2);
        expect(res[0].name).toBe('a'); // sorted by sortOrder ascending
        expect(res[1].name).toBe('b');
        expect(res.every((r: any) => r.features)).toBeTruthy();
    });
});
