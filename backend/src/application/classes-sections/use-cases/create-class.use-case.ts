import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { ClassEntity } from '../../../domain/academics/entities/class.entity';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { CLASS_CONFIG_REPOSITORY, IClassConfigRepository } from '../../../domain/ports/out/class-config-repository.port';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { CreateClassInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { createClassSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText, scopeKeyForSchoolIds, uniqueSorted } from '../utils';
import { defaultClassConfig, ensureSchoolsExist } from './shared';

@Injectable()
export class CreateClassUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(CLASS_CONFIG_REPOSITORY) private readonly classConfigRepository: IClassConfigRepository,
        @Inject(SCHOOL_REPOSITORY) private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: CreateClassInput) {
        const command = validateInput(createClassSchema, input);
        const name = normalizeOptionalText(command.name) || '';
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Class name is required' });
        }

        const schoolIds = uniqueSorted(command.schoolIds);
        if (!schoolIds.length) {
            throw classesSectionsErrors.validation({ message: 'schoolIds must include at least one school' });
        }
        await ensureSchoolsExist(command.tenantId, schoolIds, this.schoolRepository);

        const config = (await this.classConfigRepository.get(command.tenantId)) ?? defaultClassConfig(command.tenantId);
        if (config.classesScope === 'perAcademicYear' && !command.academicYearId) {
            throw classesSectionsErrors.validation({ message: 'academicYearId is required' });
        }
        if (config.requireGradeLink && !command.gradeId) {
            throw classesSectionsErrors.validation({ message: 'gradeId is required' });
        }

        if (command.gradeId) {
            const grade = await this.gradeRepository.findById(command.tenantId, command.gradeId);
            if (!grade) {
                throw classesSectionsErrors.validation({ message: 'gradeId is invalid' });
            }
            const overlaps = grade.schoolIds.some(id => schoolIds.includes(id));
            if (!overlaps) {
                throw classesSectionsErrors.validation({ message: 'gradeId school scope must overlap class schoolIds' });
            }
        }

        const normalizedName = normalizeName(name);
        const scopeKey = scopeKeyForSchoolIds(command.tenantId, schoolIds);
        const exists = await this.classRepository.existsActiveByNameScope({
            tenantId: command.tenantId,
            academicYearId: command.academicYearId ?? null,
            gradeId: command.gradeId ?? null,
            scopeKey,
            normalizedName,
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Class name already exists for this scope.');
        }
        const overlaps = await this.classRepository.findConflictsByNameOverlap({
            tenantId: command.tenantId,
            academicYearId: command.academicYearId ?? null,
            gradeId: command.gradeId ?? null,
            normalizedName,
            schoolIds,
        });
        if (overlaps.length) {
            throw classesSectionsErrors.conflict('Class name conflicts with another school scope.');
        }

        const entity = new ClassEntity({
            id: '',
            tenantId: command.tenantId,
            schoolIds,
            academicYearId: command.academicYearId ?? undefined,
            gradeId: command.gradeId ?? undefined,
            name,
            normalizedName,
            code: normalizeOptionalText(command.code),
            status: 'active',
            sortOrder: command.sortOrder ?? 0,
        });

        const saved = await this.classRepository.create(entity);
        await this.audit.log({
            category: 'classes',
            action: 'create',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'class',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
