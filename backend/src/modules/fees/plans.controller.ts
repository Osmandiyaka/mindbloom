import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeePlansService } from './plans.service';

@Controller('fees/plans')
export class FeePlansController {
    constructor(private readonly plansService: FeePlansService) {}

    @Get()
    findAll() {
        return this.plansService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.plansService.create(dto);
    }
}
