import { DeleteOrgUnitImpactUseCase } from './delete-org-unit-impact.use-case';

describe('DeleteOrgUnitImpactUseCase', () => {
    const orgUnitRepository = {
        findById: jest.fn(),
        findDescendants: jest.fn(),
    };
    const orgUnitMemberRepository = {
        countMembers: jest.fn(),
    };
    const orgUnitRoleRepository = {
        countAssignments: jest.fn(),
    };

    const useCase = new DeleteOrgUnitImpactUseCase(
        orgUnitRepository as any,
        orgUnitMemberRepository as any,
        orgUnitRoleRepository as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns impact summary for subtree', async () => {
        orgUnitRepository.findById.mockResolvedValue({ id: 'ou-1', name: 'Root' });
        orgUnitRepository.findDescendants.mockResolvedValue([
            { id: 'ou-2', name: 'Child A' },
            { id: 'ou-3', name: 'Child B' },
        ]);
        orgUnitMemberRepository.countMembers
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(5);
        orgUnitRoleRepository.countAssignments
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(3);

        const result = await useCase.execute({
            tenantId: 'tenant-1',
            orgUnitId: 'ou-1',
        } as any);

        expect(result.descendantUnitsCount).toBe(2);
        expect(result.membersDirectCount).toBe(2);
        expect(result.membersInheritedCount).toBe(5);
        expect(result.roleAssignmentsCount).toBe(1);
        expect(result.rolesInheritedImpactCount).toBe(3);
        expect(result.willDeleteUnitNamesPreview[0]).toBe('Root');
    });
});
