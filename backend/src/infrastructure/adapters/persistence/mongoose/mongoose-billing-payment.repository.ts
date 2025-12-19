import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Payment } from '../../../domain/billing/entities/payment.entity';
import { PaymentRepository } from '../../../domain/ports/out/payment-repository.port';
import { TenantScopedRepository } from '../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../common/tenant/tenant.context';
import { BillingPaymentDocument } from './schemas/billing-payment.schema';

@Injectable()
export class MongooseBillingPaymentRepository
    extends TenantScopedRepository<BillingPaymentDocument, Payment>
    implements PaymentRepository {
    constructor(
        @InjectModel('BillingPayment') private readonly paymentModel: Model<BillingPaymentDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async create(payment: Payment): Promise<Payment> {
        const tenantId = this.requireTenant(payment.tenantId);
        const doc = await this.paymentModel.create({
            _id: payment.id,
            tenantId,
            amount: payment.amount,
            currency: payment.currency,
            gateway: payment.gateway,
            status: payment.status,
            externalId: payment.externalId,
            externalType: payment.externalType,
            invoiceId: payment.invoiceId,
            metadata: payment.metadata,
            failureCode: payment.failureCode,
            failureMessage: payment.failureMessage,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        });
        return this.toDomain(doc);
    }

    async update(payment: Payment): Promise<Payment> {
        const tenantId = this.requireTenant(payment.tenantId);
        const doc = await this.paymentModel.findOneAndUpdate(
            { _id: payment.id, tenantId },
            {
                $set: {
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    externalType: payment.externalType,
                    invoiceId: payment.invoiceId,
                    metadata: payment.metadata,
                    failureCode: payment.failureCode,
                    failureMessage: payment.failureMessage,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );
        if (!doc) throw new Error('Payment not found');
        return this.toDomain(doc);
    }

    async findById(id: string, tenantId: string): Promise<Payment | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.paymentModel.findOne({ _id: id, tenantId: resolved });
        return doc ? this.toDomain(doc) : null;
    }

    async findByGatewayReference(gateway: string, externalId: string): Promise<Payment | null> {
        const doc = await this.paymentModel.findOne({ gateway, externalId });
        return doc ? this.toDomain(doc) : null;
    }

    async findByInvoiceId(invoiceId: string, tenantId: string): Promise<Payment[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.paymentModel.find({ invoiceId, tenantId: resolved });
        return docs.map(this.toDomain);
    }

    private toDomain = (doc: BillingPaymentDocument): Payment => {
        return new Payment({
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            amount: doc.amount,
            currency: doc.currency,
            gateway: doc.gateway,
            status: doc.status as any,
            externalId: doc.externalId,
            externalType: doc.externalType,
            invoiceId: doc.invoiceId,
            metadata: doc.metadata as any,
            failureCode: doc.failureCode,
            failureMessage: doc.failureMessage,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    };
}
