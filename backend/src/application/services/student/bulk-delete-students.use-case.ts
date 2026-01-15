import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';

@Injectable()
export class BulkDeleteStudentsUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) {}

    async execute(ids: string[], tenantId: string): Promise<number> {
        return this.studentRepository.deleteMany(ids, tenantId);
    }
}
