import { Body, Controller, Get, Param, Post, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvoiceUseCase } from '../../application/services/fees/create-invoice.use-case';
import { ListInvoicesUseCase } from '../../application/services/fees/list-invoices.use-case';
import { RecordPaymentUseCase } from '../../application/services/fees/record-payment.use-case';
import { CreateInvoiceDto } from '../../presentation/dtos/requests/fees/create-invoice.dto';
import { RecordPaymentDto } from '../../presentation/dtos/requests/fees/record-payment.dto';
import { FeeInvoice } from '../../domain/fees/entities/fee-invoice.entity';
import { FeePayment } from '../../domain/fees/entities/fee-payment.entity';

@ApiTags('fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('fees/invoices')
export class InvoicesController {
  constructor(
    private readonly createInvoice: CreateInvoiceUseCase,
    private readonly listInvoices: ListInvoicesUseCase,
    private readonly recordPayment: RecordPaymentUseCase,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List invoices (tenant scoped)' })
  async findAll(@Query() query: any): Promise<FeeInvoice[]> {
    const tenantId = this.tenantContext.tenantId;
    return this.listInvoices.execute(tenantId, {
      studentId: query.studentId,
      status: query.status,
      dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
      dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice for a student' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() dto: CreateInvoiceDto): Promise<FeeInvoice> {
    const tenantId = this.tenantContext.tenantId;
    return this.createInvoice.execute({
      tenantId,
      studentId: dto.studentId,
      studentName: dto.studentName,
      planId: dto.planId,
      planName: dto.planName,
      amount: dto.amount,
      currency: dto.currency,
      dueDate: new Date(dto.dueDate),
      issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
      status: dto.status,
      reference: dto.reference,
      notes: dto.notes,
    });
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async record(
    @Param('id') invoiceId: string,
    @Body() dto: RecordPaymentDto,
  ): Promise<{ invoice: FeeInvoice; payment: FeePayment }> {
    const tenantId = this.tenantContext.tenantId;
    return this.recordPayment.execute({
      tenantId,
      invoiceId,
      studentId: dto.studentId,
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      reference: dto.reference,
      notes: dto.notes,
      status: dto.status,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      recordedBy: dto.recordedBy,
    });
  }
}
