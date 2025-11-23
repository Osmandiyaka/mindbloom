import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student, EnrollmentInfo } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

export interface UpdateEnrollmentCommand {
    class?: string;
    section?: string;
    rollNumber?: string;
    academicYear?: string;
}

@Injectable()
export class UpdateStudentEnrollmentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(studentId: string, tenantId: string, command: UpdateEnrollmentCommand): Promise<Student> {
        const student = await this.studentRepository.findById(studentId, tenantId);

        if (!student) {
            throw new NotFoundException(`Student with ID ${studentId} not found`);
        }

        student.updateEnrollment(command);
        return await this.studentRepository.update(student);
    }
}
