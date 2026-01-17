import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolSettingsSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/school-settings.schema';
import { ClassDefinitionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/class-definition.schema';
import { SectionDefinitionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/section-definition.schema';
import { MongooseClassRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-class.repository';
import { CLASS_REPOSITORY } from '../../domain/ports/out/class-repository.port';
import { SchoolSettingsController } from './school-settings.controller';
import { ClassesController } from './classes.controller';
import { SchoolSettingsService } from './school-settings.service';
import { ClassesService } from './classes.service';
import { StorageManager } from '../../core/storage/storage.manager';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule, MongooseModule.forFeature([
        { name: 'SchoolSettings', schema: SchoolSettingsSchema },
        { name: 'ClassDefinition', schema: ClassDefinitionSchema },
        { name: 'SectionDefinition', schema: SectionDefinitionSchema },
    ])],
    controllers: [SchoolSettingsController, ClassesController],
    providers: [
        SchoolSettingsService,
        ClassesService,
        StorageManager,
        { provide: CLASS_REPOSITORY, useClass: MongooseClassRepository },
    ],
})
export class SetupModule { }
