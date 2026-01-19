import { CreateSectionUseCase } from './create-section.use-case';
import { ClassesSectionsDomainError } from '../errors';

const makeUseCase = () => {
    const classRepository = {
        findById: jest.fn().mockResolvedValue({
            id: 'class-1',
            tenantId: 'tenant-1',
            schoolIds: ['school-1'],
            academicYearId: null,
        }),
    } as any;
    const sectionRepository = {
        existsActiveByNameScope: jest.fn().mockResolvedValue(false),
        create: jest.fn(),
    } as any;
    const audit = { log: jest.fn() } as any;

    return {
        useCase: new CreateSectionUseCase(classRepository, sectionRepository, audit),
    };
};

describe('CreateSectionUseCase', () => {
    it('rejects schoolId outside class scope', async () => {
        const { useCase } = makeUseCase();
        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                classId: 'class-1',
                schoolId: 'school-2',
                name: 'A',
            });
            throw new Error('Expected error was not thrown.');
        } catch (err) {
            expect(err).toBeInstanceOf(ClassesSectionsDomainError);
        }
    });
});
