import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { ClassConfigEntity } from '../../../domain/academics/entities/class-config.entity';
import { CLASS_CONFIG_REPOSITORY, IClassConfigRepository } from '../../../domain/ports/out/class-config-repository.port';
import { UpdateClassConfigInput } from '../dto/class-config.inputs';
import { validateInput } from '../validation/validate-input';
import { updateClassConfigSchema } from '../validation/schemas';
import { defaultClassConfig } from './shared';

@Injectable()
export class UpdateClassConfigUseCase {
    constructor(
        @Inject(CLASS_CONFIG_REPOSITORY) private readonly classConfigRepository: IClassConfigRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: UpdateClassConfigInput) {
        const command = validateInput(updateClassConfigSchema, input);
        const existing = await this.classConfigRepository.get(command.tenantId);
        const base = existing ?? defaultClassConfig(command.tenantId);

        const updated = new ClassConfigEntity({
            tenantId: command.tenantId,
            classesScope: command.classesScope ?? base.classesScope,
            requireGradeLink: command.requireGradeLink ?? base.requireGradeLink,
            sectionUniquenessScope: command.sectionUniquenessScope ?? base.sectionUniquenessScope,
            updatedBy: command.actorUserId ?? base.updatedBy ?? null,
        });

        const saved = await this.classConfigRepository.upsert(updated);
        await this.audit.log({
            category: 'classConfig',
            action: 'update',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'classConfig',
            targetId: command.tenantId,
            before: existing?.toPrimitives() ?? null,
            after: saved.toPrimitives(),
            result: 'SUCCESS',
        });

        return saved.toPrimitives();
    }
}
