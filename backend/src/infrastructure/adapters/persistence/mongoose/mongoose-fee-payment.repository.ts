import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeePayment, FeePaymentProps } from '../../../../domain/fees/entities/fee-payment.entity';
import { FEE_PAYMENT_REPOSITORY, IFeePaymentRepository } from '../../../../domain/ports/out/fee-payment-repository.port';
import { PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class MongooseFeePaymentRepository implements IFeePaymentRepository {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(payment: FeePayment): Promise<FeePayment> {
    const doc = await this.paymentModel.create({
      _id: new Types.ObjectId(payment.id),
      tenantId: payment.tenantId,
      invoiceId: new Types.ObjectId(payment.invoiceId),
      studentId: payment.studentId ? new Types.ObjectId(payment.studentId) : undefined,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      status: payment.status,
      paidAt: payment.paidAt,
      recordedBy: payment.recordedBy ? new Types.ObjectId(payment.recordedBy) : undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
    return this.toDomain(doc);
  }

  private toDomain(doc: PaymentDocument): FeePayment {
    const props: FeePaymentProps = {
      id: doc._id.toString(),
      invoiceId: doc.invoiceId.toString(),
      tenantId: (doc as any).tenantId ? (doc as any).tenantId.toString() : '',
      studentId: doc.studentId?.toString(),
      amount: doc.amount,
      currency: doc.currency,
      method: doc.method as any,
      reference: doc.reference,
      notes: doc.notes,
      status: doc.status as any,
      paidAt: doc.paidAt,
      recordedBy: doc.recordedBy?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return new FeePayment(props);
  }
}
