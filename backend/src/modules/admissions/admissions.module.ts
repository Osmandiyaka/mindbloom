import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/admission.schema';
import { StudentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/student.schema';
import { TasksModule } from '../tasks/tasks.module';
import { FeesModule } from '../fees/fees.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Admission', schema: AdmissionSchema },
            { name: 'Student', schema: StudentSchema },
        ]),
        TasksModule,
        FeesModule,
    ],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
