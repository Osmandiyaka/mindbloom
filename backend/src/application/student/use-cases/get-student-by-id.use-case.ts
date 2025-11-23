import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

@Injectable()
export class GetStudentByIdUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(id: string): Promise<Student> {
        const student = await this.studentRepository.findById(id);

        if (!student) {
            throw new NotFoundException(`Student with ID ${id} not found`);
        }

        return student;
    }
}
