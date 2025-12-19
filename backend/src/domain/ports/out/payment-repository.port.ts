import { Payment } from '../../billing/entities/payment.entity';
import { PAYMENT_REPOSITORY } from './repository.tokens';

export interface PaymentRepository {
    create(payment: Payment): Promise<Payment>;
    update(payment: Payment): Promise<Payment>;
    findById(id: string, tenantId: string): Promise<Payment | null>;
    findByGatewayReference(gateway: string, externalId: string): Promise<Payment | null>;
    findByInvoiceId(invoiceId: string, tenantId: string): Promise<Payment[]>;
}

export { PAYMENT_REPOSITORY } from './repository.tokens';
