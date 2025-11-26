import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('fees/invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    @Get()
    findAll(@Query() query: any) {
        return this.invoicesService.findAll(query);
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() dto: CreateInvoiceDto) {
        return this.invoicesService.create(dto);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.invoicesService.getById(id);
    }

    @Get(':id/payments')
    getPayments(@Param('id') id: string) {
        return this.invoicesService.getPayments(id);
    }

    @Patch(':id/pay')
    @UsePipes(new ValidationPipe({ transform: true }))
    recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
        return this.invoicesService.recordPayment(id, dto);
    }
}
