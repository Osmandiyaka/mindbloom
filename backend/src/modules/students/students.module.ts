import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { STUDENT_REPOSITORY } from '../../domain/ports/out/student-repository.port';
import { MongooseStudentRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-student.repository';
import { StudentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/student.schema';
import {
    CreateStudentUseCase,
    GetAllStudentsUseCase,
    GetStudentByIdUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
} from '../../application/services/student';
import { AddGuardianToStudentUseCase } from '../../application/services/student/add-guardian-to-student.use-case';
import { UpdateStudentEnrollmentUseCase } from '../../application/services/student/update-student-enrollment.use-case';
import { StudentsController } from '../../presentation/controllers/students.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Student', schema: StudentSchema }]),
    ],
    controllers: [StudentsController],
    providers: [
        {
            provide: STUDENT_REPOSITORY,
            useClass: MongooseStudentRepository,
        },
        CreateStudentUseCase,
        GetAllStudentsUseCase,
        GetStudentByIdUseCase,
        UpdateStudentUseCase,
        DeleteStudentUseCase,
        AddGuardianToStudentUseCase,
        UpdateStudentEnrollmentUseCase,
    ],
    exports: [STUDENT_REPOSITORY],
})
export class StudentsModule { }
