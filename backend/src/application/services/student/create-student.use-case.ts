import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Student, StudentProps, StudentStatus } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { CreateStudentCommand } from '../../ports/in/commands/create-student.command';

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
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

        // Ensure guardians have IDs
        const guardians = command.guardians.map(g => ({
            ...g,
            id: g.id || randomUUID(),
        }));

        // Generate a new MongoDB ObjectId for the student
        const studentId = new Types.ObjectId().toString();

        const studentProps: StudentProps = {
            id: studentId,
            tenantId: command.tenantId,
            firstName: command.firstName,
            lastName: command.lastName,
            middleName: command.middleName,
            dateOfBirth: command.dateOfBirth,
            gender: command.gender as any,
            nationality: command.nationality,
            religion: command.religion,
            caste: command.caste,
            motherTongue: command.motherTongue,
            email: command.email,
            phone: command.phone,
            address: command.address,
            guardians: guardians as any,
            medicalInfo: command.medicalInfo as any,
            enrollment: command.enrollment as any,
            status: StudentStatus.ACTIVE,
            documents: [],
            photo: command.photo,
            notes: command.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const student = new Student(studentProps);
        return await this.studentRepository.create(student);
    }
}
