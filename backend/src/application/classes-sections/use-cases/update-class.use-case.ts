import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { ClassEntity } from '../../../domain/academics/entities/class.entity';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { CLASS_CONFIG_REPOSITORY, IClassConfigRepository } from '../../../domain/ports/out/class-config-repository.port';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { UpdateClassInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { updateClassSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText, scopeKeyForSchoolIds, uniqueSorted } from '../utils';
import { defaultClassConfig, ensureSchoolsExist } from './shared';

@Injectable()
export class UpdateClassUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(CLASS_CONFIG_REPOSITORY) private readonly classConfigRepository: IClassConfigRepository,
        @Inject(SCHOOL_REPOSITORY) private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: UpdateClassInput) {
        const command = validateInput(updateClassSchema, input);
        const existing = await this.classRepository.findById(command.tenantId, command.classId);
        if (!existing) {
            throw classesSectionsErrors.notFound('Class not found.');
        }

        const name = command.name !== undefined
            ? normalizeOptionalText(command.name) || ''
            : existing.name;
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Class name is required' });
        }

        const schoolIds = command.schoolIds ? uniqueSorted(command.schoolIds) : existing.schoolIds;
        if (!schoolIds.length) {
            throw classesSectionsErrors.validation({ message: 'schoolIds must include at least one school' });
        }
        await ensureSchoolsExist(command.tenantId, schoolIds, this.schoolRepository);

        const config = (await this.classConfigRepository.get(command.tenantId)) ?? defaultClassConfig(command.tenantId);
        const academicYearId = command.academicYearId !== undefined ? command.academicYearId ?? undefined : existing.academicYearId;
        const gradeId = command.gradeId !== undefined ? command.gradeId ?? undefined : existing.gradeId;

        if (config.classesScope === 'perAcademicYear' && !academicYearId) {
            throw classesSectionsErrors.validation({ message: 'academicYearId is required' });
        }
        if (config.requireGradeLink && !gradeId) {
            throw classesSectionsErrors.validation({ message: 'gradeId is required' });
        }

        if (gradeId) {
            const grade = await this.gradeRepository.findById(command.tenantId, gradeId);
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
            academicYearId: academicYearId ?? null,
            gradeId: gradeId ?? null,
            scopeKey,
            normalizedName,
            excludeId: existing.id,
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Class name already exists for this scope.');
        }
        const overlaps = await this.classRepository.findConflictsByNameOverlap({
            tenantId: command.tenantId,
            academicYearId: academicYearId ?? null,
            gradeId: gradeId ?? null,
            normalizedName,
            schoolIds,
            excludeId: existing.id,
        });
        if (overlaps.length) {
            throw classesSectionsErrors.conflict('Class name conflicts with another school scope.');
        }

        const updated = new ClassEntity({
            id: existing.id,
            tenantId: existing.tenantId,
            schoolIds,
            academicYearId: academicYearId ?? undefined,
            gradeId: gradeId ?? undefined,
            name,
            normalizedName,
            code: command.code !== undefined ? normalizeOptionalText(command.code) : existing.code,
            status: command.status ?? existing.status,
            sortOrder: command.sortOrder ?? existing.sortOrder,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
            archivedAt: existing.archivedAt,
        });

        const saved = await this.classRepository.update(updated);
        await this.audit.log({
            category: 'classes',
            action: 'update',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'class',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            before: existing.toPrimitives(),
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
