import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectModel('Invoice') private invoiceModel: Model<any>,
        @InjectModel('Payment') private paymentModel: Model<any>,
    ) { }

    async findAll(filters: any = {}) {
        const query: any = {};
        if (filters.status) query.status = filters.status;
        if (filters.studentId) query.studentId = filters.studentId;
        const list: any[] = await this.invoiceModel.find(query).sort({ createdAt: -1 }).lean().exec() as any[];
        const now = new Date();

        // auto-mark overdue
        const updates = list
            .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.dueDate && new Date(i.dueDate) < now)
            .map(i => this.invoiceModel.updateOne({ _id: i._id, status: { $ne: 'paid' } }, { status: 'overdue' }));
        if (updates.length) await Promise.all(updates);

        return (list as any[]).map((inv: any) => ({
            ...inv,
            balance: Math.max((inv.amount || 0) - (inv.paidAmount || 0), 0),
        }));
    }

    async getById(id: string) {
        const invoice: any = await this.invoiceModel.findById(id).lean();
        if (!invoice) throw new NotFoundException('Invoice not found');
        const payments = await this.paymentModel.find({ invoiceId: id }).sort({ paidAt: -1 }).lean();
        return {
            ...invoice,
            balance: Math.max((invoice.amount || 0) - (invoice.paidAmount || 0), 0),
            payments,
        };
    }

    async getPayments(id: string) {
        return this.paymentModel.find({ invoiceId: id }).sort({ paidAt: -1 }).lean();
    }

    async create(dto: CreateInvoiceDto) {
        const created = new this.invoiceModel({
            ...dto,
            currency: dto.currency || 'USD',
            status: 'issued',
            paidAmount: 0,
        });
        return created.save();
    }

    async recordPayment(id: string, dto: RecordPaymentDto) {
        const invoice = await this.invoiceModel.findById(id);
        if (!invoice) throw new NotFoundException('Invoice not found');

        const payment = new this.paymentModel({
            invoiceId: id,
            studentId: invoice.studentId,
            amount: dto.amount,
            currency: dto.currency || invoice.currency,
            method: dto.method,
            reference: dto.reference,
            notes: dto.notes,
            status: 'completed',
            paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
            recordedBy: dto.recordedBy,
        });
        await payment.save();

        const newPaid = (invoice.paidAmount || 0) + dto.amount;
        invoice.paidAmount = newPaid;
        invoice.lastPaymentAt = payment.paidAt;
        invoice.status = newPaid >= invoice.amount ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'issued';
        await invoice.save();

        return {
            invoice,
            payment,
            balance: Math.max(invoice.amount - invoice.paidAmount, 0),
        };
    }
}
