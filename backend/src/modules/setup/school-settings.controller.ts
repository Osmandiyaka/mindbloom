import { Body, Controller, Get, Put } from '@nestjs/common';
import { SchoolSettingsService } from './school-settings.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';

@Controller('setup/school')
export class SchoolSettingsController {
    constructor(private readonly schoolSettingsService: SchoolSettingsService) {}

    @Get()
    async getSettings() {
        return this.schoolSettingsService.getSettings();
    }

    @Put()
    async upsert(@Body() dto: UpdateSchoolSettingsDto) {
        return this.schoolSettingsService.upsertSettings(dto);
    }
}
