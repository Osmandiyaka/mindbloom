import { Body, Controller, Get, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { FeePlansService } from './plans.service';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';

@Controller('fees/plans')
export class FeePlansController {
    constructor(private readonly plansService: FeePlansService) {}

    @Get()
    findAll() {
        return this.plansService.findAll();
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() dto: CreateFeePlanDto) {
        return this.plansService.create(dto);
    }
}
