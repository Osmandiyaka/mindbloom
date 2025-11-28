import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { UpdateEnrollmentCommand } from '../../ports/in/commands/update-enrollment.command';

@Injectable()
export class UpdateStudentEnrollmentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(command: UpdateEnrollmentCommand): Promise<Student> {
        const student = await this.studentRepository.findById(command.studentId, command.tenantId);

        if (!student) {
            throw new NotFoundException(`Student with ID ${command.studentId} not found`);
        }

        const { studentId, tenantId, ...enrollment } = command;
        student.updateEnrollment(enrollment);
        return await this.studentRepository.update(student);
    }
}
