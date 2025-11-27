import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentService } from './enrollment.service';
import { AdmissionSchema } from '../../infrastructure/persistence/mongoose/schemas/admission.schema';
import { StudentSchema } from '../../infrastructure/persistence/mongoose/schemas/student.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Admission', schema: AdmissionSchema },
            { name: 'Student', schema: StudentSchema },
        ]),
    ],
    providers: [EnrollmentService],
    exports: [EnrollmentService],
})
export class EnrollmentModule {}
