import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';
import { TenantContext } from '../../../common/tenant/tenant.context';

export interface CreateStudentCommand {
    name: string;
    email: string;
    phone?: string;
    dob?: Date;
    classId?: string;
    rollNo?: string;
    status?: string;
}

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
        private readonly tenantContext: TenantContext,
    ) { }

    async execute(command: CreateStudentCommand): Promise<Student> {
        const tenantId = this.tenantContext.tenantId;

        const student = Student.create({
            tenantId,
            name: command.name,
            email: command.email,
            phone: command.phone,
            dob: command.dob,
            classId: command.classId,
            rollNo: command.rollNo,
            status: command.status,
        });

        return await this.studentRepository.create(student);
    }
}
