import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ADMISSION_REPOSITORY } from '../../domain/ports/out/admission-repository.port';
import { STUDENT_REPOSITORY } from '../../domain/ports/out/student-repository.port';
import { MongooseAdmissionRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-admission.repository';
import { MongooseStudentRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-student.repository';
import { AdmissionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/admission.schema';
import { StudentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/student.schema';
import {
    CreateApplicationUseCase,
    GetAllApplicationsUseCase,
    GetApplicationByIdUseCase,
    UpdateApplicationStatusUseCase,
    EnrollStudentFromApplicationUseCase,
} from '../../application/services/admission';
import { AdmissionsController } from '../../presentation/controllers/admissions.controller';
import { TasksModule } from '../tasks/tasks.module';
import { FeesModule } from '../fees/fees.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Admission', schema: AdmissionSchema },
            { name: 'Student', schema: StudentSchema },
        ]),
        EventEmitterModule.forRoot(),
        TasksModule,
        FeesModule, // Changed from AccountingModule
    ],
    controllers: [AdmissionsController],
    providers: [
        {
            provide: ADMISSION_REPOSITORY,
            useClass: MongooseAdmissionRepository,
        },
        {
            provide: STUDENT_REPOSITORY,
            useClass: MongooseStudentRepository,
        },
        CreateApplicationUseCase,
        GetAllApplicationsUseCase,
        GetApplicationByIdUseCase,
        UpdateApplicationStatusUseCase,
        EnrollStudentFromApplicationUseCase,
    ],
    exports: [ADMISSION_REPOSITORY],
})
export class AdmissionsModule { }
