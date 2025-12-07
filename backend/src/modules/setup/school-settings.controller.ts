import { Body, Controller, Get, Put, Post, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SchoolSettingsService } from './school-settings.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { FileInterceptor } from '@nestjs/platform-express';

type UploadedFileType = {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size?: number;
};

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

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: UploadedFileType,
        @Query('type') type: 'logo' | 'favicon' = 'logo',
    ) {
        return this.schoolSettingsService.uploadAsset(type, file);
    }
}
