import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

export interface UpdateStudentCommand {
    name?: string;
    email?: string;
    phone?: string;
    dob?: Date;
    classId?: string;
    rollNo?: string;
    status?: string;
}

@Injectable()
export class UpdateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(id: string, command: UpdateStudentCommand): Promise<Student> {
        const existingStudent = await this.studentRepository.findById(id);

        if (!existingStudent) {
            throw new NotFoundException(`Student with ID ${id} not found`);
        }

        return await this.studentRepository.update(id, command);
    }
}
