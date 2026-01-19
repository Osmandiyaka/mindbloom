import { Inject, Injectable } from '@nestjs/common';
import { CLASS_REPOSITORY, IClassRepository } from '../../../domain/ports/out/class-repository.port';
import { classesSectionsErrors } from '../errors';

@Injectable()
export class GetClassUseCase {
    constructor(@Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository) {}

    async execute(tenantId: string, classId: string) {
        const classEntity = await this.classRepository.findById(tenantId, classId);
        if (!classEntity) {
            throw classesSectionsErrors.notFound('Class not found.');
        }
        return classEntity.toPrimitives();
    }
}
