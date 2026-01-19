import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    CLASS_CONFIG_REPOSITORY,
    CLASS_READ_MODEL,
    CLASS_REPOSITORY,
    GRADE_REPOSITORY,
    SECTION_READ_MODEL,
    SECTION_REPOSITORY,
} from '../../domain/ports/out/repository.tokens';
import { GradeSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/grade.schema';
import { ClassSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/class.schema';
import { SectionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/section.schema';
import { ClassConfigSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/class-config.schema';
import { MongooseGradeRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-grade.repository';
import { MongooseClassRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-class.repository';
import { MongooseSectionRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-section.repository';
import { MongooseClassConfigRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-class-config.repository';
import { GradesController } from '../../presentation/controllers/grades.controller';
import { ClassesController } from '../../presentation/controllers/classes.controller';
import { SectionsController } from '../../presentation/controllers/sections.controller';
import { ClassConfigController } from '../../presentation/controllers/class-config.controller';
import { CreateGradeUseCase } from '../../application/classes-sections/use-cases/create-grade.use-case';
import { UpdateGradeUseCase } from '../../application/classes-sections/use-cases/update-grade.use-case';
import { ListGradesUseCase } from '../../application/classes-sections/use-cases/list-grades.use-case';
import { ArchiveGradeImpactUseCase } from '../../application/classes-sections/use-cases/archive-grade-impact.use-case';
import { ArchiveGradeUseCase } from '../../application/classes-sections/use-cases/archive-grade.use-case';
import { RestoreGradeUseCase } from '../../application/classes-sections/use-cases/restore-grade.use-case';
import { GetGradeUseCase } from '../../application/classes-sections/use-cases/get-grade.use-case';
import { CreateClassUseCase } from '../../application/classes-sections/use-cases/create-class.use-case';
import { UpdateClassUseCase } from '../../application/classes-sections/use-cases/update-class.use-case';
import { ListClassesUseCase } from '../../application/classes-sections/use-cases/list-classes.use-case';
import { ArchiveClassImpactUseCase } from '../../application/classes-sections/use-cases/archive-class-impact.use-case';
import { ArchiveClassUseCase } from '../../application/classes-sections/use-cases/archive-class.use-case';
import { RestoreClassUseCase } from '../../application/classes-sections/use-cases/restore-class.use-case';
import { ReorderClassesUseCase } from '../../application/classes-sections/use-cases/reorder-classes.use-case';
import { GetClassUseCase } from '../../application/classes-sections/use-cases/get-class.use-case';
import { CreateSectionUseCase } from '../../application/classes-sections/use-cases/create-section.use-case';
import { UpdateSectionUseCase } from '../../application/classes-sections/use-cases/update-section.use-case';
import { ListSectionsByClassUseCase } from '../../application/classes-sections/use-cases/list-sections-by-class.use-case';
import { ArchiveSectionUseCase } from '../../application/classes-sections/use-cases/archive-section.use-case';
import { RestoreSectionUseCase } from '../../application/classes-sections/use-cases/restore-section.use-case';
import { GetSectionUseCase } from '../../application/classes-sections/use-cases/get-section.use-case';
import { GetClassConfigUseCase } from '../../application/classes-sections/use-cases/get-class-config.use-case';
import { UpdateClassConfigUseCase } from '../../application/classes-sections/use-cases/update-class-config.use-case';
import { AuditModule } from '../audit/audit.module';
import { SchoolsModule } from '../schools/schools.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Grade', schema: GradeSchema },
            { name: 'Class', schema: ClassSchema },
            { name: 'Section', schema: SectionSchema },
            { name: 'ClassConfig', schema: ClassConfigSchema },
        ]),
        AuditModule,
        SchoolsModule,
    ],
    controllers: [GradesController, ClassesController, SectionsController, ClassConfigController],
    providers: [
        { provide: GRADE_REPOSITORY, useClass: MongooseGradeRepository },
        { provide: CLASS_REPOSITORY, useClass: MongooseClassRepository },
        { provide: CLASS_READ_MODEL, useClass: MongooseClassRepository },
        { provide: SECTION_REPOSITORY, useClass: MongooseSectionRepository },
        { provide: SECTION_READ_MODEL, useClass: MongooseSectionRepository },
        { provide: CLASS_CONFIG_REPOSITORY, useClass: MongooseClassConfigRepository },
        CreateGradeUseCase,
        GetGradeUseCase,
        UpdateGradeUseCase,
        ListGradesUseCase,
        ArchiveGradeImpactUseCase,
        ArchiveGradeUseCase,
        RestoreGradeUseCase,
        CreateClassUseCase,
        GetClassUseCase,
        UpdateClassUseCase,
        ListClassesUseCase,
        ArchiveClassImpactUseCase,
        ArchiveClassUseCase,
        RestoreClassUseCase,
        ReorderClassesUseCase,
        CreateSectionUseCase,
        GetSectionUseCase,
        UpdateSectionUseCase,
        ListSectionsByClassUseCase,
        ArchiveSectionUseCase,
        RestoreSectionUseCase,
        GetClassConfigUseCase,
        UpdateClassConfigUseCase,
    ],
})
export class ClassesSectionsModule {}
