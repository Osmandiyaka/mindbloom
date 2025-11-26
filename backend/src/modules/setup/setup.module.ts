import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolSettingsSchema } from '../../infrastructure/persistence/mongoose/schemas/school-settings.schema';
import { SchoolSettingsController } from './school-settings.controller';
import { SchoolSettingsService } from './school-settings.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'SchoolSettings', schema: SchoolSettingsSchema }])],
    controllers: [SchoolSettingsController],
    providers: [SchoolSettingsService],
})
export class SetupModule { }
