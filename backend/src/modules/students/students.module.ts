import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { STUDENT_REPOSITORY } from '../../domain/student/ports/student.repository.interface';
import { MongooseStudentRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-student.repository';
import { StudentSchema } from '../../infrastructure/persistence/mongoose/schemas/student.schema';
import {
    CreateStudentUseCase,
    GetAllStudentsUseCase,
    GetStudentByIdUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
} from '../../application/student/use-cases';
import { StudentsController } from '../../adapters/http/students/students.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Student', schema: StudentSchema }]),
    ],
    controllers: [StudentsController],
    providers: [
        // Repository adapter
        {
            provide: STUDENT_REPOSITORY,
            useClass: MongooseStudentRepository,
        },
        // Use cases
        CreateStudentUseCase,
        GetAllStudentsUseCase,
        GetStudentByIdUseCase,
        UpdateStudentUseCase,
        DeleteStudentUseCase,
    ],
    exports: [STUDENT_REPOSITORY],
})
export class StudentsModule { }
