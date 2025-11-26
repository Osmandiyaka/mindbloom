import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';

@Controller('admissions')
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) {}

    @Get()
    findAll() {
        return this.admissionsService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.admissionsService.create(dto);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.admissionsService.updateStatus(id, status);
    }
}
