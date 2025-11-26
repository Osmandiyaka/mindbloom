import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionSchema } from '../../infrastructure/persistence/mongoose/schemas/admission.schema';
import { StudentSchema } from '../../infrastructure/persistence/mongoose/schemas/student.schema';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Admission', schema: AdmissionSchema },
            { name: 'Student', schema: StudentSchema },
        ]),
        TasksModule,
    ],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
