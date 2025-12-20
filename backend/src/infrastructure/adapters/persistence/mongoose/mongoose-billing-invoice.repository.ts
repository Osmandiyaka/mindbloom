import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { BillingInvoice } from '../../../../domain/billing/entities/invoice.entity';
import { BillingInvoiceRepository } from '../../../../domain/ports/out/billing-invoice-repository.port';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { BillingInvoiceDocument } from './schemas/billing-invoice.schema';

@Injectable()
export class MongooseBillingInvoiceRepository
    extends TenantScopedRepository<BillingInvoiceDocument, BillingInvoice>
    implements BillingInvoiceRepository {
    constructor(
        @InjectModel('BillingInvoice') private readonly invoiceModel: Model<BillingInvoiceDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async create(invoice: BillingInvoice): Promise<BillingInvoice> {
        const tenantId = this.requireTenant(invoice.tenantId);
        const doc = await this.invoiceModel.create({
            _id: invoice.id,
            tenantId,
            editionId: invoice.editionId,
            periodStart: invoice.periodStart,
            periodEnd: invoice.periodEnd,
            currency: invoice.currency,
            subtotalAmount: invoice.subtotalAmount,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            invoiceNumber: invoice.invoiceNumber,
            lines: invoice.lines,
            issuedAt: invoice.issuedAt,
            paidAt: invoice.paidAt,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
        });
        return this.toDomain(doc);
    }

    async update(invoice: BillingInvoice): Promise<BillingInvoice> {
        const tenantId = this.requireTenant(invoice.tenantId);
        const doc = await this.invoiceModel.findOneAndUpdate(
            { _id: invoice.id, tenantId },
            {
                $set: {
                    editionId: invoice.editionId,
                    periodStart: invoice.periodStart,
                    periodEnd: invoice.periodEnd,
                    currency: invoice.currency,
                    subtotalAmount: invoice.subtotalAmount,
                    taxAmount: invoice.taxAmount,
                    discountAmount: invoice.discountAmount,
                    totalAmount: invoice.totalAmount,
                    status: invoice.status,
                    invoiceNumber: invoice.invoiceNumber,
                    lines: invoice.lines,
                    issuedAt: invoice.issuedAt,
                    paidAt: invoice.paidAt,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );
        if (!doc) throw new Error('Invoice not found');
        return this.toDomain(doc);
    }

    async findById(id: string, tenantId: string): Promise<BillingInvoice | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.invoiceModel.findOne({ _id: id, tenantId: resolved });
        return doc ? this.toDomain(doc) : null;
    }

    async findByPeriod(tenantId: string, editionId: string | null, periodStart: Date, periodEnd: Date): Promise<BillingInvoice | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.invoiceModel.findOne({ tenantId: resolved, editionId: editionId ?? null, periodStart, periodEnd });
        return doc ? this.toDomain(doc) : null;
    }

    async findByInvoiceNumber(invoiceNumber: string, tenantId: string): Promise<BillingInvoice | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.invoiceModel.findOne({ invoiceNumber, tenantId: resolved });
        return doc ? this.toDomain(doc) : null;
    }

    private toDomain = (doc: BillingInvoiceDocument): BillingInvoice => {
        return new BillingInvoice({
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            editionId: doc.editionId,
            periodStart: doc.periodStart,
            periodEnd: doc.periodEnd,
            currency: doc.currency,
            subtotalAmount: doc.subtotalAmount,
            taxAmount: doc.taxAmount,
            discountAmount: doc.discountAmount,
            totalAmount: doc.totalAmount,
            status: doc.status as any,
            invoiceNumber: doc.invoiceNumber,
            lines: (doc.lines || []).map(line => ({ ...line } as any)),
            issuedAt: doc.issuedAt,
            paidAt: doc.paidAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    };
}
