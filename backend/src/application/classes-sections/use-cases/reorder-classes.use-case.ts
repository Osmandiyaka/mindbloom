import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../services/audit/audit.service';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { ReorderClassesInput } from '../dto/class.inputs';
import { validateInput } from '../validation/validate-input';
import { reorderClassesSchema } from '../validation/schemas';
import { classesSectionsErrors } from '../errors';

@Injectable()
export class ReorderClassesUseCase {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        private readonly audit: AuditService,
    ) {}

    async execute(input: ReorderClassesInput) {
        const command = validateInput(reorderClassesSchema, input);
        const updates = command.updates.map(update => {
            if (!update.id || update.sortOrder === undefined) {
                throw classesSectionsErrors.validation({ message: 'Invalid class order payload.' });
            }
            return { id: update.id, sortOrder: update.sortOrder };
        });
        await this.classRepository.updateSortOrders(command.tenantId, updates);

        await this.audit.log({
            category: 'classes',
            action: 'reorder',
            scope: 'TENANT',
            actorUserId: command.actorUserId ?? null,
            tenantId: command.tenantId,
            targetType: 'class',
            result: 'SUCCESS',
        });

        return { success: true };
    }
}
