import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Admission } from '../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, ADMISSION_REPOSITORY } from '../../../domain/ports/out/admission-repository.port';

@Injectable()
export class GetApplicationByIdUseCase {
    constructor(
        @Inject(ADMISSION_REPOSITORY)
        private readonly admissionRepository: IAdmissionRepository,
    ) {}

    async execute(id: string, tenantId: string): Promise<Admission> {
        const admission = await this.admissionRepository.findById(id, tenantId);
        
        if (!admission) {
            throw new NotFoundException(`Application with ID ${id} not found`);
        }

        return admission;
    }
}
