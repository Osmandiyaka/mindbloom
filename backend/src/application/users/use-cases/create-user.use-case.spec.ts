import { CreateUserUseCase } from './create-user.use-case';
import { userErrors } from '../errors';

describe('CreateUserUseCase', () => {
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

    const useCase = new CreateUserUseCase(
        userRepository as any,
        roleRepository as any,
        schoolRepository as any,
        audit as any,
        config as any,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects duplicate email per tenant', async () => {
        userRepository.findByEmailAndTenant.mockResolvedValue({ id: 'existing' });

        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                email: 'test@example.com',
                name: 'Test User',
                password: 'Password123!',
                schoolAccess: { scope: 'all' },
            } as any);
        } catch (err) {
            const error = err as any;
            expect(error.code).toBe('conflictError');
            expect(error.message).toBe('User with this email already exists');
            return;
        }
        throw new Error('Expected conflict error');
    });

    it('rejects selected access without schools', async () => {
        userRepository.findByEmailAndTenant.mockResolvedValue(null);

        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                email: 'test@example.com',
                name: 'Test User',
                password: 'Password123!',
                schoolAccess: { scope: 'selected', schoolIds: [] },
            } as any);
        } catch (err) {
            const error = err as any;
            expect(error.code).toBe('validationError');
            return;
        }
        throw new Error('Expected validation error');
    });

    it('creates user with valid input', async () => {
        userRepository.findByEmailAndTenant.mockResolvedValue(null);
        roleRepository.findById.mockResolvedValue({ id: 'role-1' });
        schoolRepository.findById.mockResolvedValue({ id: 'school-1' });
        userRepository.create.mockResolvedValue({
            id: 'user-1',
            tenantId: 'tenant-1',
            email: 'test@example.com',
            name: 'Test User',
            phone: null,
            profilePicture: null,
            status: 'active',
            roleIds: ['role-1'],
            schoolAccess: { scope: 'selected', schoolIds: ['school-1'] },
            forcePasswordReset: false,
            mfaEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await useCase.execute({
            tenantId: 'tenant-1',
            email: 'test@example.com',
            name: 'Test User',
            password: 'Password123!',
            roleIds: ['role-1'],
            schoolAccess: { scope: 'selected', schoolIds: ['school-1'] },
        } as any);

        expect(result.email).toBe('test@example.com');
        expect(userRepository.create).toHaveBeenCalled();
        expect(audit.log).toHaveBeenCalled();
    });
});
