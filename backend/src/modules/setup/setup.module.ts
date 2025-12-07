import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolSettingsSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/school-settings.schema';
import { SchoolSettingsController } from './school-settings.controller';
import { SchoolSettingsService } from './school-settings.service';
import { StorageManager } from '../../core/storage/storage.manager';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule, MongooseModule.forFeature([{ name: 'SchoolSettings', schema: SchoolSettingsSchema }])],
    controllers: [SchoolSettingsController],
    providers: [SchoolSettingsService, StorageManager],
})
export class SetupModule { }
