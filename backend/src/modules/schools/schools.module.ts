import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/school.schema';
import { MongooseSchoolRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-school.repository';
import { SCHOOL_REPOSITORY } from '../../domain/ports/out/school-repository.port';
import { CreateSchoolUseCase, DeleteSchoolUseCase, GetSchoolsUseCase, UpdateSchoolUseCase } from '../../application/services/school';
import { SchoolsController } from '../../presentation/controllers/schools.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'School', schema: SchoolSchema }]),
        TenantModule,
    ],
    controllers: [SchoolsController],
    providers: [
        {
            provide: SCHOOL_REPOSITORY,
            useClass: MongooseSchoolRepository,
        },
        GetSchoolsUseCase,
        CreateSchoolUseCase,
        UpdateSchoolUseCase,
        DeleteSchoolUseCase,
    ],
    exports: [SCHOOL_REPOSITORY],
})
export class SchoolsModule { }
