import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionSchema } from '../../infrastructure/persistence/mongoose/schemas/admission.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'Admission', schema: AdmissionSchema }])],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
