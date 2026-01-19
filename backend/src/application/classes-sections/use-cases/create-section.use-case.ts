import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { SectionEntity } from '../../../domain/academics/entities/section.entity';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';
import { CreateSectionInput } from '../dto/section.inputs';
import { validateInput } from '../validation/validate-input';
import { createSectionSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText } from '../utils';

@Injectable()
export class CreateSectionUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: CreateSectionInput) {
        const command = validateInput(createSectionSchema, input);
        const name = normalizeOptionalText(command.name) || '';
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Section name is required' });
        }

        const classEntity = await this.classRepository.findById(command.tenantId, command.classId);
        if (!classEntity) {
            throw classesSectionsErrors.validation({ message: 'classId is invalid' });
        }
        if (!classEntity.schoolIds.includes(command.schoolId)) {
            throw classesSectionsErrors.validation({ message: 'schoolId must be within class schoolIds' });
        }

        const normalizedName = normalizeName(name);
        const exists = await this.sectionRepository.existsActiveByNameScope({
            tenantId: command.tenantId,
            classId: classEntity.id,
            schoolId: command.schoolId,
            normalizedName,
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Section name already exists for this class and school.');
        }

        const section = new SectionEntity({
            id: '',
            tenantId: command.tenantId,
            classId: classEntity.id,
            schoolId: command.schoolId,
            academicYearId: classEntity.academicYearId,
            name,
            normalizedName,
            code: normalizeOptionalText(command.code),
            capacity: command.capacity ?? undefined,
            status: 'active',
            sortOrder: command.sortOrder ?? 0,
        });

        const saved = await this.sectionRepository.create(section);
        await this.audit.log({
            category: 'sections',
            action: 'create',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'section',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
