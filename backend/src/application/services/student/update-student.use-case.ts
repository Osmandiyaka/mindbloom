import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student, StudentStatus } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';

export interface UpdateStudentCommand {
    // Personal Information
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;

    // Status
    status?: StudentStatus;

    // Additional
    photo?: string;
    notes?: string;
}

@Injectable()
export class UpdateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(id: string, tenantId: string, command: UpdateStudentCommand): Promise<Student> {
        const existingStudent = await this.studentRepository.findById(id, tenantId);

        if (!existingStudent) {
            throw new NotFoundException(`Student with ID ${id} not found`);
        }

        // Apply updates to the domain entity
        existingStudent.updateProfile(command);
        if (command.status) {
            existingStudent.changeStatus(command.status);
        }

        return await this.studentRepository.update(existingStudent);
    }
}
