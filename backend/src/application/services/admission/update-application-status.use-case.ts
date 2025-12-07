import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Admission, ApplicationStatus } from '../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, ADMISSION_REPOSITORY } from '../../../domain/ports/out/admission-repository.port';

@Injectable()
export class UpdateApplicationStatusUseCase {
    constructor(
        @Inject(ADMISSION_REPOSITORY)
        private readonly admissionRepository: IAdmissionRepository,
    ) {}

    async execute(
        id: string,
        tenantId: string,
        newStatus: ApplicationStatus,
        changedBy: string,
        note?: string,
    ): Promise<Admission> {
        const admission = await this.admissionRepository.findById(id, tenantId);
        
        if (!admission) {
            throw new NotFoundException(`Application with ID ${id} not found`);
        }

        // Use domain entity's business logic to validate transition
        if (!admission.canTransitionTo(newStatus)) {
            throw new Error(`Cannot transition from ${admission.status} to ${newStatus}`);
        }

        // Update status using domain method
        const updatedAdmission = admission.updateStatus(newStatus, changedBy, note);

        return await this.admissionRepository.update(updatedAdmission);
    }

    async acceptApplication(id: string, tenantId: string, changedBy: string, offerExpiresInDays: number = 7): Promise<Admission> {
        const admission = await this.execute(id, tenantId, ApplicationStatus.ACCEPTED, changedBy, 'Application accepted');
        
        // Set offer expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + offerExpiresInDays);

        const admissionWithOffer = new Admission({
            ...admission as any,
            offerSentAt: new Date(),
            offerExpiresAt: expiresAt,
        });

        return await this.admissionRepository.update(admissionWithOffer);
    }

    async rejectApplication(id: string, tenantId: string, changedBy: string, reason?: string): Promise<Admission> {
        return await this.execute(id, tenantId, ApplicationStatus.REJECTED, changedBy, reason);
    }
}
