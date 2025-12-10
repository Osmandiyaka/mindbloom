export type PaymentStatus = 'completed' | 'pending' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online' | 'other';

export interface FeePaymentProps {
  id: string;
  invoiceId: string;
  tenantId: string;
  studentId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  paidAt: Date;
  recordedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FeePayment {
  private props: FeePaymentProps;

  constructor(props: FeePaymentProps) {
    this.props = props;
    this.validate();
  }

  private validate() {
    if (!this.props.id) throw new Error('Payment id is required');
    if (!this.props.invoiceId) throw new Error('Invoice id is required');
    if (!this.props.tenantId) throw new Error('Tenant id is required');
    if (!this.props.amount || this.props.amount <= 0) throw new Error('Amount must be positive');
    if (!this.props.currency) throw new Error('Currency is required');
    if (!this.props.method) throw new Error('Payment method is required');
  }

  get id() { return this.props.id; }
  get invoiceId() { return this.props.invoiceId; }
  get tenantId() { return this.props.tenantId; }
  get studentId() { return this.props.studentId; }
  get amount() { return this.props.amount; }
  get currency() { return this.props.currency; }
  get method() { return this.props.method; }
  get reference() { return this.props.reference; }
  get notes() { return this.props.notes; }
  get status() { return this.props.status; }
  get paidAt() { return this.props.paidAt; }
  get recordedBy() { return this.props.recordedBy; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  toJSON(): FeePaymentProps {
    return { ...this.props };
  }
}
