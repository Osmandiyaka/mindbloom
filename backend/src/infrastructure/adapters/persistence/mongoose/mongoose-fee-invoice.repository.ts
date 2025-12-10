import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeeInvoice, FeeInvoiceProps, InvoiceStatus } from '../../../../domain/fees/entities/fee-invoice.entity';
import { FEE_INVOICE_REPOSITORY, FeeInvoiceFilters, IFeeInvoiceRepository } from '../../../../domain/ports/out/fee-invoice-repository.port';
import { InvoiceDocument } from './schemas/invoice.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseFeeInvoiceRepository extends TenantScopedRepository<InvoiceDocument, FeeInvoice> implements IFeeInvoiceRepository {
  constructor(
    @InjectModel('Invoice')
    private readonly invoiceModel: Model<InvoiceDocument>,
    tenantContext: TenantContext,
  ) {
    super(tenantContext);
  }

  async create(invoice: FeeInvoice): Promise<FeeInvoice> {
    const tenantId = this.requireTenant(invoice.tenantId);
    const doc = await this.invoiceModel.create({
      _id: new Types.ObjectId(invoice.id),
      tenantId,
      studentId: invoice.studentId ? new Types.ObjectId(invoice.studentId) : undefined,
      studentName: invoice.studentName,
      planId: invoice.planId ? new Types.ObjectId(invoice.planId) : undefined,
      planName: invoice.planName,
      dueDate: invoice.dueDate,
      issuedDate: invoice.issuedDate,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      currency: invoice.currency,
      status: invoice.status,
      reference: invoice.reference,
      notes: invoice.notes,
      lastPaymentAt: invoice.lastPaymentAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    });
    return this.toDomain(doc);
  }

  async findById(id: string, tenantId: string): Promise<FeeInvoice | null> {
    const resolved = this.requireTenant(tenantId);
    const doc = await this.invoiceModel.findOne({ _id: id, tenantId: resolved });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(tenantId: string, filters: FeeInvoiceFilters = {}): Promise<FeeInvoice[]> {
    const resolved = this.requireTenant(tenantId);
    const query: any = { tenantId: resolved };
    if (filters.studentId) query.studentId = new Types.ObjectId(filters.studentId);
    if (filters.status) query.status = filters.status;
    if (filters.dueFrom || filters.dueTo) {
      query.dueDate = {};
      if (filters.dueFrom) query.dueDate.$gte = filters.dueFrom;
      if (filters.dueTo) query.dueDate.$lte = filters.dueTo;
    }
    const docs = await this.invoiceModel.find(query).sort({ dueDate: 1, createdAt: -1 });
    return docs.map(this.toDomain);
  }

  async update(invoice: FeeInvoice): Promise<FeeInvoice> {
    const tenantId = this.requireTenant(invoice.tenantId);
    const doc = await this.invoiceModel.findOneAndUpdate(
      { _id: invoice.id, tenantId },
      {
        $set: {
          studentName: invoice.studentName,
          planId: invoice.planId ? new Types.ObjectId(invoice.planId) : undefined,
          planName: invoice.planName,
          dueDate: invoice.dueDate,
          issuedDate: invoice.issuedDate,
          amount: invoice.amount,
          paidAmount: invoice.paidAmount,
          currency: invoice.currency,
          status: invoice.status,
          reference: invoice.reference,
          notes: invoice.notes,
          lastPaymentAt: invoice.lastPaymentAt,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!doc) throw new Error('Invoice not found');
    return this.toDomain(doc);
  }

  private toDomain = (doc: any): FeeInvoice => {
    const props: FeeInvoiceProps = {
      id: doc._id.toString(),
      tenantId: doc.tenantId.toString(),
      studentId: doc.studentId?.toString(),
      studentName: doc.studentName,
      planId: doc.planId?.toString(),
      planName: doc.planName,
      amount: doc.amount,
      currency: doc.currency,
      issuedDate: doc.issuedDate,
      dueDate: doc.dueDate,
      paidAmount: doc.paidAmount,
      status: doc.status as InvoiceStatus,
      reference: doc.reference,
      notes: doc.notes,
      lastPaymentAt: doc.lastPaymentAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return new FeeInvoice(props);
  };
}
