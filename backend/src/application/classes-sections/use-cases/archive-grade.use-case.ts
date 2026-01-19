import { Inject, Injectable } from '@nestjs/common';
import { classesSectionsErrors } from '../errors';
import { ArchiveGradeInput } from '../dto/grade.inputs';
import { validateInput } from '../validation/validate-input';
import { archiveSchema } from '../validation/schemas';
import { GRADE_REPOSITORY, IGradeRepository } from '../../../domain/ports/out/grade-repository.port';
import { CLASS_REPOSITORY, IClassRepository, IClassReadModelPort, CLASS_READ_MODEL } from '../../../domain/ports/out/class-repository.port';
import { assertConfirmationText } from './shared';
import { hasOverlap } from '../utils';
import { AuditService } from '../../services/audit/audit.service';

@Injectable()
export class ArchiveGradeUseCase {
    constructor(
        @Inject(GRADE_REPOSITORY) private readonly gradeRepository: IGradeRepository,
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(CLASS_READ_MODEL) private readonly classReadModel: IClassReadModelPort,
        private readonly audit: AuditService,
    ) {}

    async execute(input: ArchiveGradeInput) {
        const command = validateInput(archiveSchema, {
            tenantId: input.tenantId,
            id: input.gradeId,
            confirmationText: input.confirmationText,
            actorUserId: input.actorUserId,
        });
        const grade = await this.gradeRepository.findById(command.tenantId, command.id);
        if (!grade) {
            throw classesSectionsErrors.notFound('Grade not found.');
        }

        const classes = await this.classRepository.listByGradeId(command.tenantId, grade.id, 'active');
        const impactedClasses = classes.filter(item => hasOverlap(item.schoolIds, grade.schoolIds));
        if (impactedClasses.length) {
            assertConfirmationText(grade.name, command.confirmationText);
        }

        await this.gradeRepository.archive(command.tenantId, grade.id, command.actorUserId);
        const sectionsCount = impactedClasses.length
            ? await Promise.all(impactedClasses.map(row => this.classReadModel.countSectionsByClass(command.tenantId, row.id)))
            : [];

        await this.audit.log({
            category: 'grades',
            action: 'archive',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'grade',
            targetId: grade.id,
            targetNameSnapshot: grade.name,
            before: grade.toPrimitives(),
            after: { ...grade.toPrimitives(), status: 'archived' },
            result: 'SUCCESS',
        });

        return {
            gradeId: grade.id,
            classesCount: impactedClasses.length,
            sectionsCount: sectionsCount.reduce((sum, count) => sum + count, 0),
        };
    }
}
