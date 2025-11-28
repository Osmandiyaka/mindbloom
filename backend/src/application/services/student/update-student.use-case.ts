import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { UpdateStudentCommand } from '../../ports/in/commands/update-student.command';

@Injectable()
export class UpdateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(command: UpdateStudentCommand): Promise<Student> {
        const existingStudent = await this.studentRepository.findById(command.id, command.tenantId);

        if (!existingStudent) {
            throw new NotFoundException(`Student with ID ${command.id} not found`);
        }

        // Apply updates to the domain entity
        existingStudent.updateProfile(command);
        if (command.status) {
            existingStudent.changeStatus(command.status);
        }

        return await this.studentRepository.update(existingStudent);
    }
}
