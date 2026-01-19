import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { GradeEntity } from '../../../domain/academics/entities/grade.entity';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { UpdateGradeInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { updateGradeSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText, scopeKeyForSchoolIds, uniqueSorted } from '../utils';
import { ensureSchoolsExist } from './shared';

@Injectable()
export class UpdateGradeUseCase {
    constructor(
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(SCHOOL_REPOSITORY) private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: UpdateGradeInput) {
        const command = validateInput(updateGradeSchema, input);
        const existing = await this.gradeRepository.findById(command.tenantId, command.gradeId);
        if (!existing) {
            throw classesSectionsErrors.notFound('Grade not found.');
        }

        const name = command.name !== undefined
            ? normalizeOptionalText(command.name) || ''
            : existing.name;
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Grade name is required' });
        }

        const schoolIds = command.schoolIds ? uniqueSorted(command.schoolIds) : existing.schoolIds;
        if (!schoolIds.length) {
            throw classesSectionsErrors.validation({ message: 'schoolIds must include at least one school' });
        }
        await ensureSchoolsExist(command.tenantId, schoolIds, this.schoolRepository);

        const normalizedName = normalizeName(name);
        const scopeKey = scopeKeyForSchoolIds(command.tenantId, schoolIds);
        const exists = await this.gradeRepository.existsActiveByNameScope({
            tenantId: command.tenantId,
            scopeKey,
            normalizedName,
            excludeId: existing.id,
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Grade name already exists for this school scope.');
        }
        const overlapConflicts = await this.gradeRepository.findConflictsByNameOverlap({
            tenantId: command.tenantId,
            normalizedName,
            schoolIds,
            excludeId: existing.id,
        });
        if (overlapConflicts.length) {
            throw classesSectionsErrors.conflict('Grade name conflicts with another school scope.');
        }

        const updated = new GradeEntity({
            id: existing.id,
            tenantId: existing.tenantId,
            schoolIds,
            name,
            normalizedName,
            code: command.code !== undefined ? normalizeOptionalText(command.code) : existing.code,
            sortOrder: command.sortOrder ?? existing.sortOrder,
            status: command.status ?? existing.status,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
            archivedAt: existing.archivedAt,
        });

        const saved = await this.gradeRepository.update(updated);
        await this.audit.log({
            category: 'grades',
            action: 'update',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'grade',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            before: existing.toPrimitives(),
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
