import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Student, StudentProps, StudentStatus } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { CreateStudentCommand } from '../../ports/in/commands/create-student.command';
import { TenantLimitEnforcementService } from '../tenant/tenant-limit-enforcement.service';

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
        private readonly tenantLimits: TenantLimitEnforcementService,
    ) { }

    async execute(command: CreateStudentCommand): Promise<Student> {
        // Check if admission number already exists
        const existing = await this.studentRepository.findByAdmissionNumber(
            command.enrollment.admissionNumber,
            command.tenantId,
        );

        if (existing) {
            throw new Error(`Student with admission number ${command.enrollment.admissionNumber} already exists`);
        }

        // Ensure guardians have IDs and at least one primary
        const guardians = command.guardians.map(g => ({
            ...g,
            id: g.id || randomUUID(),
        }));
        const hasPrimary = guardians.some(g => g.isPrimary);
        if (!hasPrimary) {
            throw new Error('At least one primary guardian is required');
        }

        // Generate a new MongoDB ObjectId for the student
        const studentId = new Types.ObjectId().toString();

        const studentProps: StudentProps = {
            id: studentId,
            tenantId: command.tenantId,
            schoolId: command.schoolId,
            firstName: command.firstName,
            lastName: command.lastName,
            middleName: command.middleName,
            dateOfBirth: command.dateOfBirth ? new Date(command.dateOfBirth) : null as any,
            gender: command.gender as any,
            nationality: command.nationality,
            religion: command.religion,
            caste: command.caste,
            email: command.email,
            phone: command.phone,
            address: command.address,
            guardians: guardians as any,
            medicalInfo: command.medicalInfo as any,
            enrollment: {
                ...command.enrollment,
                admissionDate: new Date(command.enrollment.admissionDate),
            } as any,
            status: StudentStatus.ACTIVE,
            documents: [],
            photo: command.photo,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.tenantLimits.assertCanCreateStudent(command.tenantId);

        const student = new Student(studentProps);
        return await this.studentRepository.create(student);
    }
}
