import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
    it('returns entitlements for tenant edition', async () => {
        const tenantRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'tenant-1',
                editionId: 'professional',
                metadata: {},
            }),
        } as any;

        const service = new EntitlementsService(tenantRepository);
        const entitlements = await service.getEntitlementsForTenant('tenant-1');

        expect(entitlements.edition?.code).toBe('professional');
        expect(entitlements.modules.dashboard).toBe(true);
        expect(entitlements.requiresEditionSelection).toBe(false);
    });

    it('flags edition selection when tenant has no edition', async () => {
        const tenantRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'tenant-2',
                editionId: null,
                metadata: {},
            }),
        } as any;

        const service = new EntitlementsService(tenantRepository);
        const entitlements = await service.getEntitlementsForTenant('tenant-2');

        expect(entitlements.edition).toBeNull();
        expect(entitlements.requiresEditionSelection).toBe(true);
    });
});
