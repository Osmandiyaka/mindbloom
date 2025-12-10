import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicsController } from './academics.controller';
import { AcademicRecordSchema, AcademicRecordDocument } from '../../infrastructure/adapters/persistence/mongoose/schemas/academic-record.schema';
import { ACADEMIC_RECORD_REPOSITORY } from '../../domain/ports/out/academic-record-repository.port';
import { MongooseAcademicRecordRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-academic-record.repository';
import { CreateAcademicRecordUseCase } from '../../application/services/academics/create-academic-record.use-case';
import { ListAcademicRecordsUseCase } from '../../application/services/academics/list-academic-records.use-case';
import { UpdateAcademicRecordUseCase } from '../../application/services/academics/update-academic-record.use-case';
import { DeleteAcademicRecordUseCase } from '../../application/services/academics/delete-academic-record.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AcademicRecordDocument.name, schema: AcademicRecordSchema },
        ]),
    ],
    controllers: [AcademicsController],
    providers: [
        {
            provide: ACADEMIC_RECORD_REPOSITORY,
            useClass: MongooseAcademicRecordRepository,
        },
        CreateAcademicRecordUseCase,
        ListAcademicRecordsUseCase,
        UpdateAcademicRecordUseCase,
        DeleteAcademicRecordUseCase,
    ],
    exports: [ACADEMIC_RECORD_REPOSITORY],
})
export class AcademicsModule { }
