import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY, StudentFilters } from '../../../domain/student/ports/student.repository.interface';

@Injectable()
export class GetAllStudentsUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(tenantId: string, filters?: StudentFilters): Promise<Student[]> {
        return await this.studentRepository.findAll(tenantId, filters);
    }
}
