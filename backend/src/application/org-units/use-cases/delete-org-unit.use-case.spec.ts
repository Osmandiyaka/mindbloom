import { DeleteOrgUnitUseCase } from './delete-org-unit.use-case';

describe('DeleteOrgUnitUseCase', () => {
    const orgUnitRepository = {
        findById: jest.fn(),
        findDescendants: jest.fn(),
        updateMany: jest.fn(),
    };
    const orgUnitMemberRepository = {
        countMembers: jest.fn(),
        removeByOrgUnitIds: jest.fn(),
    };
    const orgUnitRoleRepository = {
        countAssignments: jest.fn(),
        removeByOrgUnitIds: jest.fn(),
    };
    const audit = { log: jest.fn() };

    const useCase = new DeleteOrgUnitUseCase(
        orgUnitRepository as any,
        orgUnitMemberRepository as any,
        orgUnitRoleRepository as any,
        audit as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('archives subtree for delete', async () => {
        orgUnitRepository.findById.mockResolvedValue({
            id: 'ou-1',
            name: 'Root',
            status: 'active',
            archivedAt: null,
        });
        orgUnitRepository.findDescendants.mockResolvedValue([
            { id: 'ou-2', name: 'Child' },
        ]);
        orgUnitMemberRepository.countMembers.mockResolvedValue(0);
        orgUnitRoleRepository.countAssignments.mockResolvedValue(0);

        await useCase.execute({
            tenantId: 'tenant-1',
            orgUnitId: 'ou-1',
        } as any);

        const updatedIds = orgUnitRepository.updateMany.mock.calls[0][0];
        expect(updatedIds).toEqual(['ou-1', 'ou-2']);
        expect(orgUnitMemberRepository.removeByOrgUnitIds).toHaveBeenCalledWith('tenant-1', ['ou-1', 'ou-2']);
        expect(orgUnitRoleRepository.removeByOrgUnitIds).toHaveBeenCalledWith('tenant-1', ['ou-1', 'ou-2']);
    });
});
