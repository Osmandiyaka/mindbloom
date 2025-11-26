import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('fees/invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    @Get()
    findAll() {
        return this.invoicesService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.invoicesService.create(dto);
    }

    @Patch(':id/pay')
    markPaid(@Param('id') id: string) {
        return this.invoicesService.markPaid(id);
    }
}
