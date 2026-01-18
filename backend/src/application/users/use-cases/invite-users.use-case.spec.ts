import { InviteUsersUseCase } from './invite-users.use-case';
import { userErrors } from '../errors';

describe('InviteUsersUseCase', () => {
    const userRepository = {
        findByEmailAndTenant: jest.fn(),
        create: jest.fn(),
    };
    const roleRepository = {
        findById: jest.fn(),
    };
    const schoolRepository = {
        findById: jest.fn(),
    };
    const audit = { log: jest.fn() };
    const config = { get: jest.fn() };

    const useCase = new InviteUsersUseCase(
        userRepository as any,
        roleRepository as any,
        schoolRepository as any,
        audit as any,
        config as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects missing schools for selected access', async () => {
        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                emails: ['one@example.com'],
                schoolAccess: { scope: 'selected', schoolIds: [] },
            } as any);
        } catch (err) {
            const error = err as any;
            expect(error.code).toBe('validationError');
            return;
        }
        throw new Error('Expected validation error');
    });

    it('invites new users and skips existing', async () => {
        userRepository.findByEmailAndTenant
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 'existing' });

        userRepository.create.mockResolvedValue({
            id: 'user-1',
            tenantId: 'tenant-1',
            email: 'one@example.com',
            name: '',
            phone: null,
            profilePicture: null,
            status: 'invited',
            roleIds: [],
            schoolAccess: { scope: 'all' },
            forcePasswordReset: true,
            mfaEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await useCase.execute({
            tenantId: 'tenant-1',
            emails: ['one@example.com', 'two@example.com'],
            schoolAccess: { scope: 'all' },
        } as any);

        expect(result.length).toBe(1);
        expect(result[0].email).toBe('one@example.com');
        expect(userRepository.create).toHaveBeenCalledTimes(1);
        expect(audit.log).toHaveBeenCalled();
    });
});
