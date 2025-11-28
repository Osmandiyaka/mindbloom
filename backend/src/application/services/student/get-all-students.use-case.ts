import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY, StudentFilters } from '../../../domain/ports/out/student-repository.port';

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
