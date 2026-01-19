import { CreateClassUseCase } from './create-class.use-case';
import { ClassesSectionsDomainError } from '../errors';

const makeUseCase = () => {
    const classRepository = {
        existsActiveByNameScope: jest.fn(),
        findConflictsByNameOverlap: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
    } as any;
    const gradeRepository = { findById: jest.fn() } as any;
    const classConfigRepository = { get: jest.fn().mockResolvedValue(null) } as any;
    const schoolRepository = {
        findAll: jest.fn().mockResolvedValue([{ id: 'school-1' }]),
    } as any;
    const audit = { log: jest.fn() } as any;

    return {
        useCase: new CreateClassUseCase(
            classRepository,
            gradeRepository,
            classConfigRepository,
            schoolRepository,
            audit,
        ),
        classRepository,
    };
};

describe('CreateClassUseCase', () => {
    it('throws when class name already exists for scope', async () => {
        const { useCase, classRepository } = makeUseCase();
        classRepository.existsActiveByNameScope.mockResolvedValue(true);

        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                schoolIds: ['school-1'],
                name: 'Grade 1',
            });
            throw new Error('Expected error was not thrown.');
        } catch (err) {
            expect(err).toBeInstanceOf(ClassesSectionsDomainError);
        }
    });
});
