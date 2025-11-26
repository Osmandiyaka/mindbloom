import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class InvoicesService {
    constructor(@InjectModel('Invoice') private invoiceModel: Model<any>) { }

    async findAll() {
        return this.invoiceModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: any) {
        const created = new this.invoiceModel(dto);
        return created.save();
    }

    async markPaid(id: string) {
        const updated = await this.invoiceModel.findByIdAndUpdate(
            id,
            { status: 'paid', updatedAt: new Date() },
            { new: true }
        );
        if (!updated) throw new NotFoundException('Invoice not found');
        return updated;
    }
}
