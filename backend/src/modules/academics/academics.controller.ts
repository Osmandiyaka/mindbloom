import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
    constructor(private readonly academicsService: AcademicsService) { }

    @Get()
    findAll() {
        return this.academicsService.findAll();
    }
}
