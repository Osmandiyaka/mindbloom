import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { FeePlansService } from './plans.service';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from './dto/update-fee-plan.dto';

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

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    update(@Param('id') id: string, @Body() dto: UpdateFeePlanDto) {
        return this.plansService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
