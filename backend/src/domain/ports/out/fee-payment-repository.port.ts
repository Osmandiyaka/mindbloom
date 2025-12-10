import { FeePayment } from '../../fees/entities/fee-payment.entity';

export const FEE_PAYMENT_REPOSITORY = 'FEE_PAYMENT_REPOSITORY';

export interface IFeePaymentRepository {
  create(payment: FeePayment): Promise<FeePayment>;
}
