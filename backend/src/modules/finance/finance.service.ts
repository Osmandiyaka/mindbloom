import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class FinanceService {
    constructor(
        @InjectModel('Budget') private budgetModel: Model<any>,
        @InjectModel('PurchaseRequest') private prModel: Model<any>,
        @InjectModel('ExpenseClaim') private expenseModel: Model<any>,
        private readonly accounting: AccountingService,
    ) { }

    async listBudgets(tenantId?: string) {
        const filters: any = {};
        if (tenantId) filters.tenantId = tenantId;
        return this.budgetModel.find(filters).sort({ createdAt: -1 }).lean();
    }

    async createBudget(dto: any) {
        if (!dto.name || !dto.code) throw new BadRequestException('Budget name/code required');
        const exists = await this.budgetModel.findOne({ code: dto.code, tenantId: dto.tenantId });
        if (exists) throw new BadRequestException('Budget code already used');
        const created = new this.budgetModel({
            ...dto,
            spent: 0,
            status: 'active',
        });
        return created.save();
    }

    async requestPurchase(dto: any) {
        const budget = await this.budgetModel.findById(dto.budgetId);
        if (!budget) throw new NotFoundException('Budget not found');
        if (budget.status !== 'active') throw new BadRequestException('Budget is closed');
        if ((budget.spent || 0) + dto.amount > budget.limit) throw new BadRequestException('Budget exceeds limit');
        const created = new this.prModel({
            ...dto,
            budgetCode: budget.code,
            budgetName: budget.name,
            status: 'pending',
        });
        return created.save();
    }

    async listPurchaseRequests(status?: string, tenantId?: string) {
        const filters: any = {};
        if (status) filters.status = status;
        if (tenantId) filters.tenantId = tenantId;
        return this.prModel.find(filters).sort({ createdAt: -1 }).lean();
    }

    async approvePurchase(id: string, approver: { id?: string; name?: string; note?: string }) {
        const pr = await this.prModel.findById(id);
        if (!pr) throw new NotFoundException('Request not found');
        if (pr.status !== 'pending') throw new BadRequestException('Request already processed');

        const budget = await this.budgetModel.findById(pr.budgetId);
        if (!budget) throw new NotFoundException('Budget missing');
        if ((budget.spent || 0) + pr.amount > budget.limit) throw new BadRequestException('Budget exceeds limit');

        pr.status = 'approved';
        pr.approvedAt = new Date();
        pr.approvals = [...(pr.approvals || []), {
            approverId: approver.id,
            approverName: approver.name,
            approvedAt: pr.approvedAt,
            note: approver.note,
        }];

        budget.spent = (budget.spent || 0) + pr.amount;

        const journal = await this.accounting.postJournal({
            date: new Date(),
            memo: `Purchase approval for ${pr.description}`,
            source: 'finance',
            sourceId: pr.id || pr._id,
            lines: [
                { accountCode: '5000', debit: pr.amount, credit: 0, memo: 'Expense' },
                { accountCode: '2000', debit: 0, credit: pr.amount, memo: 'Accounts Payable' },
            ],
        });
        pr.journalId = journal._id;

        await Promise.all([pr.save(), budget.save()]);
        return pr.toObject();
    }

    async createExpense(dto: any) {
        const budget = dto.budgetId ? await this.budgetModel.findById(dto.budgetId) : null;
        const created = new this.expenseModel({
            ...dto,
            budgetCode: budget?.code,
            budgetName: budget?.name,
            status: dto.status || 'submitted',
            submittedAt: new Date(),
        });
        return created.save();
    }

    async listExpenses(status?: string, tenantId?: string) {
        const filters: any = {};
        if (status) filters.status = status;
        if (tenantId) filters.tenantId = tenantId;
        return this.expenseModel.find(filters).sort({ createdAt: -1 }).lean();
    }

    async approveExpense(id: string, approver: { id?: string; name?: string }) {
        const claim = await this.expenseModel.findById(id);
        if (!claim) throw new NotFoundException('Expense not found');
        if (claim.status === 'approved') return claim;

        const budget = claim.budgetId ? await this.budgetModel.findById(claim.budgetId) : null;
        if (budget && (budget.spent || 0) + claim.amount > budget.limit) {
            throw new BadRequestException('Budget exceeds limit');
        }

        claim.status = 'approved';
        claim.approvedAt = new Date();
        if (budget) {
            budget.spent = (budget.spent || 0) + claim.amount;
        }

        const journal = await this.accounting.postJournal({
            date: new Date(),
            memo: `Expense claim for ${claim.purpose}`,
            source: 'finance',
            sourceId: claim.id || claim._id,
            lines: [
                { accountCode: '5000', debit: claim.amount, credit: 0, memo: 'Expense' },
                { accountCode: '1000', debit: 0, credit: claim.amount, memo: 'Cash' },
            ],
        });
        claim.journalId = journal._id;

        await Promise.all([claim.save(), budget?.save()]);
        return claim.toObject();
    }
}
