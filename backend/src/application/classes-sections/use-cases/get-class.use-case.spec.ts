import { GetClassUseCase } from './get-class.use-case';

const makeUseCase = () => {
    const classRepository = {
        findById: jest.fn().mockResolvedValue({
            id: 'class-1',
            tenantId: 'tenant-1',
            toPrimitives: () => ({ id: 'class-1' }),
        }),
    } as any;
    return { useCase: new GetClassUseCase(classRepository), classRepository };
};

describe('GetClassUseCase', () => {
    it('scopes lookup by tenant', async () => {
        const { useCase, classRepository } = makeUseCase();
        await useCase.execute('tenant-1', 'class-1');
        expect(classRepository.findById).toHaveBeenCalledWith('tenant-1', 'class-1');
    });
});
