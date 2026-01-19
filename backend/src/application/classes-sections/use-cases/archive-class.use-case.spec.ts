import { ArchiveClassUseCase } from './archive-class.use-case';
import { ClassesSectionsDomainError } from '../errors';

const makeUseCase = () => {
    const classRepository = {
        findById: jest.fn().mockResolvedValue({
            id: 'class-1',
            tenantId: 'tenant-1',
            name: 'Class A',
            toPrimitives: () => ({ id: 'class-1', name: 'Class A' }),
        }),
        archive: jest.fn(),
    } as any;
    const classReadModel = {
        countSectionsByClass: jest.fn().mockResolvedValue(2),
    } as any;
    const sectionRepository = {
        archiveByClassId: jest.fn(),
    } as any;
    const audit = { log: jest.fn() } as any;

    return {
        useCase: new ArchiveClassUseCase(classRepository, classReadModel, sectionRepository, audit),
    };
};

describe('ArchiveClassUseCase', () => {
    it('requires confirmation when sections exist', async () => {
        const { useCase } = makeUseCase();
        try {
            await useCase.execute({
                tenantId: 'tenant-1',
                classId: 'class-1',
                confirmationText: 'wrong',
            });
            throw new Error('Expected error was not thrown.');
        } catch (err) {
            expect(err).toBeInstanceOf(ClassesSectionsDomainError);
        }
    });
});
