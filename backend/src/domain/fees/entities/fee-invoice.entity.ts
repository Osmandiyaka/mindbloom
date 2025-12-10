export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

export interface FeeInvoiceProps {
  id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  planId?: string;
  planName?: string;
  amount: number;
  currency: string;
  issuedDate: Date;
  dueDate: Date;
  paidAmount: number;
  status: InvoiceStatus;
  reference?: string;
  notes?: string;
  lastPaymentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class FeeInvoice {
  private props: FeeInvoiceProps;

  constructor(props: FeeInvoiceProps) {
    this.props = props;
    this.validate();
  }

  private validate() {
    if (!this.props.id) throw new Error('Invoice id is required');
    if (!this.props.tenantId) throw new Error('Tenant id is required');
    if (!this.props.studentId) throw new Error('Student id is required');
    if (!this.props.amount || this.props.amount < 0) throw new Error('Amount is required');
    if (!this.props.currency) throw new Error('Currency is required');
    if (!this.props.dueDate) throw new Error('Due date is required');
    if (!this.props.status) throw new Error('Status is required');
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get studentId() { return this.props.studentId; }
  get studentName() { return this.props.studentName; }
  get planId() { return this.props.planId; }
  get planName() { return this.props.planName; }
  get amount() { return this.props.amount; }
  get currency() { return this.props.currency; }
  get issuedDate() { return this.props.issuedDate; }
  get dueDate() { return this.props.dueDate; }
  get paidAmount() { return this.props.paidAmount; }
  get status() { return this.props.status; }
  get reference() { return this.props.reference; }
  get notes() { return this.props.notes; }
  get lastPaymentAt() { return this.props.lastPaymentAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  get balance(): number {
    return Math.max(this.props.amount - (this.props.paidAmount || 0), 0);
  }

  recordPayment(amount: number, paidAt: Date) {
    this.props.paidAmount = (this.props.paidAmount || 0) + amount;
    this.props.lastPaymentAt = paidAt;
    if (this.props.paidAmount >= this.props.amount) {
      this.props.status = 'paid';
    }
  }

  updateStatus(status: InvoiceStatus) {
    this.props.status = status;
  }

  toJSON(): FeeInvoiceProps {
    return { ...this.props };
  }
}
