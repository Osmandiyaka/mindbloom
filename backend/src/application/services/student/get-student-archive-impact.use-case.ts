import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { StudentStatus } from '../../../domain/student/entities/student.entity';

export type StudentArchiveImpact = {
    total: number;
    activeCount: number;
    linkedAccountsCount: number;
};

@Injectable()
export class GetStudentArchiveImpactUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) {}

    async execute(ids: string[], tenantId: string): Promise<StudentArchiveImpact> {
        const students = await this.studentRepository.findByIds(ids, tenantId);
        const activeCount = students.filter((student) => student.status === StudentStatus.ACTIVE).length;
        return {
            total: students.length,
            activeCount,
            linkedAccountsCount: 0,
        };
    }
}
