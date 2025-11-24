import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryFineLedger, FineEntryType, FineReason } from '../schemas/fine-ledger.schema';
import { AssessFineDto, RecordPaymentDto, WaiveFineDto, VoidEntryDto, FineLedgerQueryDto } from '../dto/fine.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class FinesService {
    constructor(
        @InjectModel('LibraryFineLedger')
        private readonly ledgerModel: Model<LibraryFineLedger>,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Assess a fine for a patron
     * - Creates immutable ledger entry
     * - Calculates new balance
     */
    async assessFine(assessDto: AssessFineDto): Promise<LibraryFineLedger> {
        const tenantId = this.tenantContext.tenantId;

        // Get current balance
        const currentBalance = await this.getPatronBalance(assessDto.patronId);

        // Get next sequence number
        const sequenceNumber = await this.getNextSequenceNumber(assessDto.patronId);

        // Create ledger entry
        const entry = new this.ledgerModel({
            tenantId,
            patronId: assessDto.patronId,
            entryType: FineEntryType.ASSESSED,
            amount: assessDto.amount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance + assessDto.amount,
            transactionId: assessDto.transactionId,
            copyId: assessDto.copyId,
            reason: assessDto.reason,
            description: assessDto.description,
            daysOverdue: assessDto.daysOverdue,
            fineRatePerDay: assessDto.fineRatePerDay,
            recordedAt: new Date(),
            recordedBy: 'SYSTEM', // TODO: Get from context
            sequenceNumber,
        });

        await entry.save();

        return entry;
    }

    /**
     * Record a payment
     * - Creates payment ledger entry
     * - Reduces balance
     */
    async recordPayment(paymentDto: RecordPaymentDto): Promise<LibraryFineLedger> {
        const tenantId = this.tenantContext.tenantId;

        // Get current balance
        const currentBalance = await this.getPatronBalance(paymentDto.patronId);

        if (currentBalance <= 0) {
            throw new Error('No outstanding fines to pay');
        }

        if (paymentDto.amount > currentBalance) {
            throw new Error(`Payment amount ${paymentDto.amount} exceeds outstanding balance ${currentBalance}`);
        }

        // Get next sequence number
        const sequenceNumber = await this.getNextSequenceNumber(paymentDto.patronId);

        // Create ledger entry
        const entry = new this.ledgerModel({
            tenantId,
            patronId: paymentDto.patronId,
            entryType: FineEntryType.PAID,
            amount: paymentDto.amount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - paymentDto.amount,
            transactionId: paymentDto.transactionId,
            paymentMethod: paymentDto.paymentMethod,
            paymentReference: paymentDto.paymentReference,
            paymentDate: paymentDto.paymentDate || new Date(),
            paymentNotes: paymentDto.paymentNotes,
            recordedAt: new Date(),
            recordedBy: 'SYSTEM', // TODO: Get from context
            sequenceNumber,
            receiptNumber: await this.generateReceiptNumber(),
            receiptGeneratedAt: new Date(),
        });

        await entry.save();

        return entry;
    }

    /**
     * Waive a fine
     * - Creates waiver ledger entry
     * - Reduces balance
     */
    async waiveFine(waiveDto: WaiveFineDto): Promise<LibraryFineLedger> {
        const tenantId = this.tenantContext.tenantId;

        // Get current balance
        const currentBalance = await this.getPatronBalance(waiveDto.patronId);

        if (currentBalance <= 0) {
            throw new Error('No outstanding fines to waive');
        }

        if (waiveDto.amount > currentBalance) {
            throw new Error(`Waiver amount ${waiveDto.amount} exceeds outstanding balance ${currentBalance}`);
        }

        // Get next sequence number
        const sequenceNumber = await this.getNextSequenceNumber(waiveDto.patronId);

        // Create ledger entry
        const entry = new this.ledgerModel({
            tenantId,
            patronId: waiveDto.patronId,
            entryType: FineEntryType.WAIVED,
            amount: waiveDto.amount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - waiveDto.amount,
            transactionId: waiveDto.transactionId,
            waiverReason: waiveDto.waiverReason,
            waiverApprovalRequired: waiveDto.waiverApprovalRequired,
            recordedAt: new Date(),
            recordedBy: 'SYSTEM', // TODO: Get from context
            sequenceNumber,
        });

        await entry.save();

        return entry;
    }

    /**
     * Void a ledger entry
     * - Marks entry as voided (never delete)
     * - Creates offsetting entry
     */
    async voidEntry(voidDto: VoidEntryDto, voidedBy: string): Promise<LibraryFineLedger> {
        const tenantId = this.tenantContext.tenantId;

        const entry = await this.ledgerModel.findOne({ _id: voidDto.entryId, tenantId });

        if (!entry) {
            throw new NotFoundException('Ledger entry not found');
        }

        if (entry.isVoided) {
            throw new Error('Entry is already voided');
        }

        // Mark as voided
        entry.isVoided = true;
        entry.voidedAt = new Date();
        entry.voidedBy = voidedBy;
        entry.voidReason = voidDto.voidReason;

        await entry.save();

        return entry;
    }

    /**
     * Get patron's current balance
     */
    async getPatronBalance(patronId: string): Promise<number> {
        const tenantId = this.tenantContext.tenantId;

        // Get the latest entry for this patron
        const latestEntry = await this.ledgerModel
            .findOne({
                tenantId,
                patronId,
                isVoided: false,
            })
            .sort({ sequenceNumber: -1 });

        return latestEntry ? latestEntry.balanceAfter : 0;
    }

    /**
     * Get patron's ledger history
     */
    async getPatronLedger(patronId: string): Promise<LibraryFineLedger[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.ledgerModel
            .find({ tenantId, patronId })
            .sort({ sequenceNumber: 1 });
    }

    /**
     * Find all ledger entries with filtering
     */
    async findAll(queryDto: FineLedgerQueryDto): Promise<PaginatedResponse<LibraryFineLedger>> {
        const tenantId = this.tenantContext.tenantId;
        const {
            patronId,
            transactionId,
            entryType,
            reason,
            fromDate,
            toDate,
            isVoided = false,
            page = 1,
            limit = 50,
        } = queryDto;

        const filter: any = { tenantId, isVoided };

        if (patronId) filter.patronId = patronId;
        if (transactionId) filter.transactionId = transactionId;
        if (entryType) filter.entryType = entryType;
        if (reason) filter.reason = reason;

        if (fromDate || toDate) {
            filter.recordedAt = {};
            if (fromDate) filter.recordedAt.$gte = fromDate;
            if (toDate) filter.recordedAt.$lte = toDate;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.ledgerModel
                .find(filter)
                .populate('patronId', 'name email')
                .populate('transactionId')
                .sort({ recordedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.ledgerModel.countDocuments(filter)
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get next sequence number for patron
     */
    private async getNextSequenceNumber(patronId: string): Promise<number> {
        const tenantId = this.tenantContext.tenantId;

        const lastEntry = await this.ledgerModel
            .findOne({ tenantId, patronId })
            .sort({ sequenceNumber: -1 });

        return lastEntry ? lastEntry.sequenceNumber + 1 : 1;
    }

    /**
     * Generate receipt number
     */
    private async generateReceiptNumber(): Promise<string> {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RCP-${timestamp}-${random}`;
    }

    /**
     * Get total fines collected in a period
     */
    async getTotalFinesCollected(fromDate: Date, toDate: Date): Promise<number> {
        const tenantId = this.tenantContext.tenantId;

        const result = await this.ledgerModel.aggregate([
            {
                $match: {
                    tenantId,
                    entryType: FineEntryType.PAID,
                    isVoided: false,
                    recordedAt: { $gte: fromDate, $lte: toDate },
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        return result.length > 0 ? result[0].total : 0;
    }

    /**
     * Get patrons with outstanding fines
     */
    async getPatronsWithFines(): Promise<Array<{ patronId: string; balance: number }>> {
        const tenantId = this.tenantContext.tenantId;

        const result = await this.ledgerModel.aggregate([
            {
                $match: {
                    tenantId,
                    isVoided: false,
                }
            },
            {
                $sort: { patronId: 1, sequenceNumber: -1 }
            },
            {
                $group: {
                    _id: '$patronId',
                    latestBalance: { $first: '$balanceAfter' }
                }
            },
            {
                $match: {
                    latestBalance: { $gt: 0 }
                }
            },
            {
                $project: {
                    patronId: '$_id',
                    balance: '$latestBalance',
                    _id: 0
                }
            }
        ]);

        return result;
    }
}
