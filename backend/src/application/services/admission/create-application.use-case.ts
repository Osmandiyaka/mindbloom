import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Admission, ApplicationStatus, ApplicationSource } from '../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, ADMISSION_REPOSITORY } from '../../../domain/ports/out/admission-repository.port';
import { CreateApplicationCommand } from '../../ports/in/commands/create-application.command';

@Injectable()
export class CreateApplicationUseCase {
    constructor(
        @Inject(ADMISSION_REPOSITORY)
        private readonly admissionRepository: IAdmissionRepository,
    ) {}

    async execute(command: CreateApplicationCommand): Promise<Admission> {
        // Check if application with same email already exists for this tenant
        const existingByEmail = await this.admissionRepository.findByEmail(
            command.email,
            command.tenantId,
        );

        if (existingByEmail && !existingByEmail.isEnrolled()) {
            throw new Error(`An application with email ${command.email} already exists`);
        }

        // Generate application number
        const applicationNumber = this.generateApplicationNumber();

        // Ensure all guardians have IDs
        const guardians = command.guardians.map(g => ({
            ...g,
            id: new Types.ObjectId().toString(),
        }));

        // Create admission entity
        const now = new Date();
        const admission = Admission.create({
            tenantId: command.tenantId,
            applicationNumber,
            source: command.source as ApplicationSource,
            status: ApplicationStatus.INQUIRY, // Initial status
            firstName: command.firstName,
            lastName: command.lastName,
            middleName: command.middleName,
            dateOfBirth: new Date(command.dateOfBirth),
            gender: command.gender as any,
            nationality: command.nationality,
            religion: command.religion,
            bloodGroup: command.bloodGroup,
            email: command.email,
            phone: command.phone,
            address: command.address as any,
            guardians: guardians as any,
            gradeApplying: command.gradeApplying,
            academicYear: command.academicYear,
            previousSchool: command.previousSchool as any,
            personalStatement: command.personalStatement,
            notes: command.notes,
            applicationFeeAmount: command.applicationFeeAmount,
            applicationFeePaid: command.applicationFeePaid || false,
            documents: [],
            submittedAt: command.source === 'online' ? now : undefined,
        });

        return await this.admissionRepository.create(admission);
    }

    private generateApplicationNumber(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `APP-${year}-${random}`;
    }
}
