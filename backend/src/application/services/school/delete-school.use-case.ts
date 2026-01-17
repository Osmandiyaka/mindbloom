import { Inject } from '@nestjs/common';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';

export class DeleteSchoolUseCase {
    constructor(
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
    ) { }

    async execute(tenantId: string, id: string): Promise<void> {
        await this.schoolRepository.delete(id, tenantId);
    }
}
