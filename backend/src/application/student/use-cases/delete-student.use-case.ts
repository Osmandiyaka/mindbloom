import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

@Injectable()
export class DeleteStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const student = await this.studentRepository.findById(id);

        if (!student) {
            throw new NotFoundException(`Student with ID ${id} not found`);
        }

        await this.studentRepository.delete(id);
    }
}
