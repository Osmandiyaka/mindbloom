import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { SectionEntity } from '../../../domain/academics/entities/section.entity';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';
import { UpdateSectionInput } from '../dto/section.inputs';
import { validateInput } from '../validation/validate-input';
import { updateSectionSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';
import { normalizeName, normalizeOptionalText } from '../utils';

@Injectable()
export class UpdateSectionUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        @Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: UpdateSectionInput) {
        const command = validateInput(updateSectionSchema, input);
        const existing = await this.sectionRepository.findById(command.tenantId, command.sectionId);
        if (!existing) {
            throw classesSectionsErrors.notFound('Section not found.');
        }

        const name = command.name !== undefined
            ? normalizeOptionalText(command.name) || ''
            : existing.name;
        if (!name) {
            throw classesSectionsErrors.validation({ message: 'Section name is required' });
        }

        const schoolId = command.schoolId ?? existing.schoolId;
        if (command.schoolId) {
            const classEntity = await this.classRepository.findById(command.tenantId, existing.classId);
            if (!classEntity) {
                throw classesSectionsErrors.validation({ message: 'classId is invalid' });
            }
            if (!classEntity.schoolIds.includes(schoolId)) {
                throw classesSectionsErrors.validation({ message: 'schoolId must be within class schoolIds' });
            }
        }

        const normalizedName = normalizeName(name);
        const exists = await this.sectionRepository.existsActiveByNameScope({
            tenantId: command.tenantId,
            classId: existing.classId,
            schoolId,
            normalizedName,
            excludeId: existing.id,
        });
        if (exists) {
            throw classesSectionsErrors.conflict('Section name already exists for this class and school.');
        }

        const updated = new SectionEntity({
            id: existing.id,
            tenantId: existing.tenantId,
            classId: existing.classId,
            schoolId,
            academicYearId: existing.academicYearId,
            name,
            normalizedName,
            code: command.code !== undefined ? normalizeOptionalText(command.code) : existing.code,
            capacity: command.capacity !== undefined ? command.capacity ?? undefined : existing.capacity,
            status: command.status ?? existing.status,
            sortOrder: command.sortOrder ?? existing.sortOrder,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
            archivedAt: existing.archivedAt,
        });

        const saved = await this.sectionRepository.update(updated);
        await this.audit.log({
            category: 'sections',
            action: 'update',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'section',
            targetId: saved.id,
            targetNameSnapshot: saved.name,
            before: existing.toPrimitives(),
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
