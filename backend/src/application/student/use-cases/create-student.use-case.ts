import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

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
    ) { }

    async execute(command: CreateStudentCommand): Promise<Student> {
        const student = Student.create({
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
