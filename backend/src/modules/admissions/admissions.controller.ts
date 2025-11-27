import { Body, Controller, Get, Param, Patch, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';
import { AdmissionsQueryDto } from './dto/admissions-query.dto';
import { RecentInvoicesQueryDto } from './dto/recent-invoices-query.dto';

@Controller('admissions')
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) {}

    @Get()
    findAll(@Query() query: AdmissionsQueryDto) {
        return this.admissionsService.findAll(query);
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    create(@Body() dto: CreateAdmissionDto) {
        return this.admissionsService.create(dto);
    }

    @Get('pipeline')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    pipeline(@Query() query: AdmissionsQueryDto) {
        return this.admissionsService.getPipeline(query);
    }

    @Get('recent-invoices')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    recentInvoices(@Query() query: RecentInvoicesQueryDto) {
        return this.admissionsService.recentInvoices(query);
    }

    @Patch(':id/status')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    updateStatus(@Param('id') id: string, @Body() dto: UpdateAdmissionStatusDto, @Req() req: any) {
        const actor = dto.userId || req.headers['x-user-id'] || 'demo-user';
        return this.admissionsService.updateStatus(id, dto, actor);
    }
}
