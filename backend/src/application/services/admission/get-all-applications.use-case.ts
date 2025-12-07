import { Inject, Injectable } from '@nestjs/common';
import { Admission } from '../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, AdmissionFilters, ADMISSION_REPOSITORY } from '../../../domain/ports/out/admission-repository.port';

@Injectable()
export class GetAllApplicationsUseCase {
    constructor(
        @Inject(ADMISSION_REPOSITORY)
        private readonly admissionRepository: IAdmissionRepository,
    ) {}

    async execute(tenantId: string, filters?: AdmissionFilters): Promise<Admission[]> {
        return await this.admissionRepository.findAll(tenantId, filters);
    }

    async executeWithCount(tenantId: string, filters?: AdmissionFilters): Promise<{ applications: Admission[]; total: number }> {
        const [applications, total] = await Promise.all([
            this.admissionRepository.findAll(tenantId, filters),
            this.admissionRepository.count(tenantId, filters),
        ]);

        return { applications, total };
    }

    async getPipelineCounts(tenantId: string): Promise<Record<string, number>> {
        return await this.admissionRepository.countByStatus(tenantId);
    }
}
