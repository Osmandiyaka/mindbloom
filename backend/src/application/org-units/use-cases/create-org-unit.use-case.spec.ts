import { CreateOrgUnitUseCase } from './create-org-unit.use-case';

describe('CreateOrgUnitUseCase', () => {
    const orgUnitRepository = {
        findById: jest.fn(),
        create: jest.fn(),
    };
    const audit = { log: jest.fn() };

    const useCase = new CreateOrgUnitUseCase(
        orgUnitRepository as any,
        audit as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a root org unit', async () => {
        orgUnitRepository.create.mockImplementation(async (unit: any) => unit);

        const result = await useCase.execute({
            tenantId: 'tenant-1',
            name: 'Root',
            actorUserId: 'user-1',
        } as any);

        expect(result.name).toBe('Root');
        const createdArg = orgUnitRepository.create.mock.calls[0][0];
        expect(createdArg.path.length).toBe(0);
    });

    it('creates a child org unit with parent path', async () => {
        orgUnitRepository.findById.mockResolvedValue({
            id: 'parent-1',
            tenantId: 'tenant-1',
            name: 'Parent',
            status: 'active',
            path: [],
        });
        orgUnitRepository.create.mockImplementation(async (unit: any) => unit);

        const result = await useCase.execute({
            tenantId: 'tenant-1',
            name: 'Child',
            parentId: 'parent-1',
        } as any);

        expect(result.parentId).toBe('parent-1');
        const createdArg = orgUnitRepository.create.mock.calls[0][0];
        expect(createdArg.path).toEqual(['parent-1']);
    });

    it('rejects a parent with cyclical path', async () => {
        orgUnitRepository.findById.mockResolvedValue({
            id: 'parent-1',
            tenantId: 'tenant-1',
            name: 'Parent',
            status: 'active',
            path: ['parent-1'],
        });

        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                name: 'Child',
                parentId: 'parent-1',
            } as any);
        } catch (err: any) {
            expect(err.code).toBe('validationError');
            return;
        }
        throw new Error('Expected validation error');
    });
});
