import { Inject, Injectable } from '@nestjs/common';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/ports/out/section-repository.port';
import { classesSectionsErrors } from '../errors';

@Injectable()
export class GetSectionUseCase {
    constructor(@Inject(SECTION_REPOSITORY) private readonly sectionRepository: ISectionRepository) {}

    async execute(tenantId: string, sectionId: string) {
        const section = await this.sectionRepository.findById(tenantId, sectionId);
        if (!section) {
            throw classesSectionsErrors.notFound('Section not found.');
        }
        return section.toPrimitives();
    }
}
