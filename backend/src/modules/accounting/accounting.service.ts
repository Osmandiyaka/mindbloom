import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AccountingService {
    constructor(
        @InjectModel('ChartAccount') private accountModel: Model<any>,
        @InjectModel('JournalEntry') private journalModel: Model<any>,
        @InjectModel('FiscalPeriod') private periodModel: Model<any>,
    ) { }

    async ensureSeedAccounts() {
        const defaults = [
            { code: '1000', name: 'Cash', type: 'asset' },
            { code: '1100', name: 'Accounts Receivable', type: 'asset' },
            { code: '2000', name: 'Accounts Payable', type: 'liability' },
            { code: '4000', name: 'Tuition Revenue', type: 'income' },
            { code: '5000', name: 'Misc Expense', type: 'expense' },
        ];
        for (const acc of defaults) {
            await this.accountModel.updateOne({ code: acc.code }, { $setOnInsert: acc }, { upsert: true });
        }
    }

    async listAccounts() {
        return this.accountModel.find({}).sort({ code: 1 }).lean();
    }

    async createAccount(dto: any) {
        const existing = await this.accountModel.findOne({ code: dto.code });
        if (existing) throw new BadRequestException('Account code already exists');
        const created = new this.accountModel(dto);
        return created.save();
    }

    async postJournal(dto: { refNo?: string; date: Date; memo?: string; lines: any[]; source?: string; sourceId?: string }) {
        if (!dto.lines?.length) throw new BadRequestException('Journal lines required');
        const debit = dto.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
        const credit = dto.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
        if (Math.round((debit - credit) * 100) !== 0) {
            throw new BadRequestException('Debits and credits must balance');
        }
        await this.checkOpenPeriod(dto.date);
        const entry = new this.journalModel({
            ...dto,
            status: 'posted',
            postedAt: new Date(),
        });
        return entry.save();
    }

    async trialBalance(asOf?: Date) {
        const match: any = { status: 'posted' };
        if (asOf) match.date = { $lte: asOf };
        const pipeline: any[] = [
            { $match: match },
            { $unwind: '$lines' },
            {
                $group: {
                    _id: '$lines.accountCode',
                    debit: { $sum: '$lines.debit' },
                    credit: { $sum: '$lines.credit' },
                },
            },
            { $project: { accountCode: '$_id', balance: { $subtract: ['$debit', '$credit'] }, debit: 1, credit: 1, _id: 0 } },
            { $sort: { accountCode: 1 } },
        ];
        return this.journalModel.aggregate(pipeline);
    }

    async checkOpenPeriod(date: Date) {
        const period: any = await this.periodModel.findOne({ start: { $lte: date }, end: { $gte: date } }).lean();
        if (period && period.status && period.status !== 'open') throw new BadRequestException('Period is closed/locked');
        return true;
    }

    async listPeriods() {
        return this.periodModel.find({}).sort({ start: -1 }).lean();
    }

    async upsertPeriod(dto: { name: string; start: Date; end: Date }) {
        if (!dto.start || !dto.end) throw new BadRequestException('Start/end required');
        const existing = await this.periodModel.findOne({ name: dto.name });
        if (existing) {
            Object.assign(existing, dto);
            return existing.save();
        }
        const created = new this.periodModel(dto);
        return created.save();
    }

    async closePeriod(id: string) {
        const period = await this.periodModel.findById(id);
        if (!period) throw new BadRequestException('Period not found');
        period.status = 'closed';
        period.lockedAt = new Date();
        return period.save();
    }

    async reopenPeriod(id: string) {
        const period = await this.periodModel.findById(id);
        if (!period) throw new BadRequestException('Period not found');
        period.status = 'open';
        period.lockedAt = undefined;
        return period.save();
    }
}
