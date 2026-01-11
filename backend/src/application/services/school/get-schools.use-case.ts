import { Inject, Injectable } from '@nestjs/common';
import { ISchoolRepository, SCHOOL_REPOSITORY } from '../../../domain/ports/out/school-repository.port';
import { School } from '../../../domain/school/entities/school.entity';

@Injectable()
export class GetSchoolsUseCase {
    constructor(
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
    ) { }

    async execute(tenantId: string): Promise<School[]> {
        return this.schoolRepository.findAll(tenantId);
    }
}
