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
import { StudentNotesController } from '../../presentation/controllers/student-notes.controller';
import { StudentNoteDocument, StudentNoteSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/student-note.schema';
import { STUDENT_NOTE_REPOSITORY } from '../../domain/ports/out/student-note-repository.port';
import { MongooseStudentNoteRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-student-note.repository';
import { CreateStudentNoteUseCase } from '../../application/services/student-notes/create-student-note.use-case';
import { GetStudentNotesUseCase } from '../../application/services/student-notes/get-student-notes.use-case';
import { TenantLimitEnforcementService } from '../../application/services/tenant/tenant-limit-enforcement.service';
import { TenantModule } from '../tenant/tenant.module';
import { PluginsModule } from '../plugins/plugins.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Student', schema: StudentSchema },
            { name: StudentNoteDocument.name, schema: StudentNoteSchema },
        ]),
        TenantModule,
        PluginsModule,
    ],
    controllers: [StudentsController, StudentNotesController],
    providers: [
        {
            provide: STUDENT_REPOSITORY,
            useClass: MongooseStudentRepository,
        },
        {
            provide: STUDENT_NOTE_REPOSITORY,
            useClass: MongooseStudentNoteRepository,
        },
        CreateStudentUseCase,
        GetAllStudentsUseCase,
        GetStudentByIdUseCase,
        UpdateStudentUseCase,
        DeleteStudentUseCase,
        AddGuardianToStudentUseCase,
        UpdateStudentEnrollmentUseCase,
        CreateStudentNoteUseCase,
        GetStudentNotesUseCase,
        TenantLimitEnforcementService,
    ],
    exports: [STUDENT_REPOSITORY, STUDENT_NOTE_REPOSITORY],
})
export class StudentsModule { }
