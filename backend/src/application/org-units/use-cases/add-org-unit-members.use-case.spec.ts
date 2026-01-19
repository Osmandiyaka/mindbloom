import { AddOrgUnitMembersUseCase } from './add-org-unit-members.use-case';

describe('AddOrgUnitMembersUseCase', () => {
    const orgUnitRepository = {
        findById: jest.fn(),
    };
    const orgUnitMemberRepository = {
        addMembers: jest.fn(),
    };
    const userRepository = {
        findById: jest.fn(),
    };
    const audit = { log: jest.fn() };

    const useCase = new AddOrgUnitMembersUseCase(
        orgUnitRepository as any,
        orgUnitMemberRepository as any,
        userRepository as any,
        audit as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects users from another tenant', async () => {
        orgUnitRepository.findById.mockResolvedValue({ id: 'ou-1', name: 'Unit' });
        userRepository.findById.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-2' });

        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                orgUnitId: 'ou-1',
                userIds: ['user-1'],
            } as any);
        } catch (err: any) {
            expect(err.code).toBe('validationError');
            return;
        }
        throw new Error('Expected validation error');
    });
});
