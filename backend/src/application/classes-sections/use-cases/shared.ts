import { ClassConfigEntity } from '../../../domain/academics/entities/class-config.entity';
import { classesSectionsErrors } from '../errors';
import { ISchoolRepository } from '../../../domain/ports/out/school-repository.port';
import { normalizeName, requireConfirmation, uniqueSorted } from '../utils';

export const defaultClassConfig = (tenantId: string) =>
    new ClassConfigEntity({
        tenantId,
        classesScope: 'global',
        requireGradeLink: false,
        sectionUniquenessScope: 'perClassPerSchool',
    });

export const ensureSchoolsExist = async (
    tenantId: string,
    schoolIds: string[],
    schoolRepository: ISchoolRepository,
) => {
    const schools = await schoolRepository.findAll(tenantId);
    const validIds = new Set(schools.map(school => school.id));
    const missing = uniqueSorted(schoolIds).filter(id => !validIds.has(id));
    if (missing.length) {
        throw classesSectionsErrors.validation({
            message: 'Invalid schoolIds',
            missing,
        });
    }
};

export const assertConfirmationText = (name: string, confirmationText?: string) => {
    if (!requireConfirmation(name, confirmationText)) {
        throw classesSectionsErrors.validation({
            message: 'Confirmation text does not match',
            expected: normalizeName(name),
        });
    }
};
