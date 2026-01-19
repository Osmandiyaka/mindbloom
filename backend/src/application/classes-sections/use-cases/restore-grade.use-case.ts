import { Inject, Injectable } from '@nestjs/common';
import { classesSectionsErrors } from '../errors';
import { RestoreGradeInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { restoreSchema } from '../validation/schemas';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { AuditService } from '../../services/audit/audit.service';

@Injectable()
export class RestoreGradeUseCase {
    constructor(
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: RestoreGradeInput) {
        const command = validateInput(restoreSchema, {
            tenantId: input.tenantId,
            id: input.gradeId,
            actorUserId: input.actorUserId,
        });
        const grade = await this.gradeRepository.findById(command.tenantId, command.id);
        if (!grade) {
            throw classesSectionsErrors.notFound('Grade not found.');
        }

        await this.gradeRepository.restore(command.tenantId, grade.id, command.actorUserId);
        await this.audit.log({
            category: 'grades',
            action: 'restore',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'grade',
            targetId: grade.id,
            targetNameSnapshot: grade.name,
            before: grade.toPrimitives(),
            after: { ...grade.toPrimitives(), status: 'active' },
            result: 'SUCCESS',
        });

        return { gradeId: grade.id };
    }
}
