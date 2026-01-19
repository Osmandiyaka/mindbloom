import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { GradeEntity } from '../../../domain/academics/entities/grade.entity';
import { GRADE_REPOSITORY } from '../../../domain/ports/out/grade-repository.port';
import { IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { CreateGradeInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { createGradeSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText, scopeKeyForSchoolIds, uniqueSorted } from '../utils';
import { ensureSchoolsExist } from './shared';

@Injectable()
export class CreateGradeUseCase {
    constructor(
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(SCHOOL_REPOSITORY) private readonly schoolRepository: ISchoolRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: CreateGradeInput) {
        const command = validateInput(createGradeSchema, input);
        const name = normalizeOptionalText(command.name) || '';
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Grade name is required' });
        }
        const schoolIds = uniqueSorted(command.schoolIds);
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
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Grade name already exists for this school scope.');
        }
        const overlapConflicts = await this.gradeRepository.findConflictsByNameOverlap({
            tenantId: command.tenantId,
            normalizedName,
            schoolIds,
        });
        if (overlapConflicts.length) {
            throw classesSectionsErrors.conflict('Grade name conflicts with another school scope.');
        }

        const grade = new GradeEntity({
            id: '',
            tenantId: command.tenantId,
            schoolIds,
            name,
            normalizedName,
            code: normalizeOptionalText(command.code),
            sortOrder: command.sortOrder ?? 0,
            status: 'active',
        });

        const saved = await this.gradeRepository.create(grade);
        await this.audit.log({
            category: 'grades',
            action: 'create',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'grade',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
