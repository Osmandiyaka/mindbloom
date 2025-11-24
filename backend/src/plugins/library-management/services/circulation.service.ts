import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryBorrowTransaction, TransactionStatus } from '../schemas/borrow-transaction.schema';
import { CopyStatus } from '../schemas/copy.schema';
import { CheckoutDto, CheckinDto, RenewDto, TransactionQueryDto, BulkCheckoutDto, BulkCheckinDto } from '../dto/transaction.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';
import { CopiesService } from './copies.service';
import { TitlesService } from './titles.service';
import { ReservationsService } from './reservations.service';
import { FinesService } from './fines.service';
import { SettingsService } from './settings.service';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class CirculationService {
    constructor(
        @InjectModel('LibraryBorrowTransaction')
        private readonly transactionModel: Model<LibraryBorrowTransaction>,
        private readonly tenantContext: TenantContext,
        private readonly copiesService: CopiesService,
        private readonly titlesService: TitlesService,
        private readonly reservationsService: ReservationsService,
        private readonly finesService: FinesService,
        private readonly settingsService: SettingsService,
    ) {}

    /**
     * Checkout a copy to a patron
     * - Validates copy is available
     * - Checks patron limits and fines
     * - Applies loan policy
     * - Updates copy status
     */
    async checkout(checkoutDto: CheckoutDto, librarianId: string): Promise<LibraryBorrowTransaction> {
        const tenantId = this.tenantContext.tenantId;

        // Get copy and validate
        const copy = await this.copiesService.findById(checkoutDto.copyId);
        
        if (copy.status !== CopyStatus.AVAILABLE && copy.status !== CopyStatus.ON_HOLD_SHELF) {
            throw new BadRequestException(`Copy is not available for checkout. Current status: ${copy.status}`);
        }

        // Get patron's loan policy
        const settings = await this.settingsService.getSettings();
        const loanPolicy = settings.defaultLoanPolicy; // TODO: Get by patron type

        // Check patron's outstanding items
        const activeTransactions = await this.getActiveTransactionsByPatron(checkoutDto.borrowerId);
        if (activeTransactions.length >= loanPolicy.maxItemsCheckedOut) {
            throw new ForbiddenException(
                `Patron has reached maximum checkout limit of ${loanPolicy.maxItemsCheckedOut} items`
            );
        }

        // Check patron's fines
        if (settings.circulationSettings?.blockCheckoutIfFines) {
            const balance = await this.finesService.getPatronBalance(checkoutDto.borrowerId);
            const threshold = settings.circulationSettings.fineThresholdForBlock || 0;
            
            if (balance > threshold) {
                throw new ForbiddenException(
                    `Patron has outstanding fines of ${balance}. Please clear fines before checkout.`
                );
            }
        }

        // Calculate due date
        const borrowedAt = new Date();
        const dueDate = checkoutDto.dueDate || new Date(
            borrowedAt.getTime() + loanPolicy.loanPeriodDays * 24 * 60 * 60 * 1000
        );

        // Create transaction
        const transaction = new this.transactionModel({
            tenantId,
            copyId: copy._id,
            bookTitleId: copy.bookTitleId,
            borrowerId: checkoutDto.borrowerId,
            borrowedAt,
            dueDate,
            expectedReturnDate: dueDate,
            status: TransactionStatus.ACTIVE,
            renewalCount: 0,
            maxRenewals: loanPolicy.maxRenewals,
            checkoutLibrarianId: librarianId,
            checkoutMethod: checkoutDto.checkoutMethod || 'DESK',
            loanPeriodDays: loanPolicy.loanPeriodDays,
            fineRatePerDay: settings.finePolicy?.overdueRatePerDay || 0,
            maxFineAmount: settings.finePolicy?.maxFineAmount || 0,
            notes: checkoutDto.notes ? [checkoutDto.notes] : [],
        });

        await transaction.save();

        // Update copy status
        await this.copiesService.updateStatus(copy._id.toString(), {
            newStatus: CopyStatus.CHECKED_OUT,
            reason: `Checked out to patron`,
            updatedBy: librarianId,
        });

        // Update copy's current transaction
        await this.copiesService.update(copy._id.toString(), {
            // currentTransactionId: transaction._id,
            // currentBorrowerId: checkoutDto.borrowerId,
        } as any);

        // Increment circulation counts
        await this.copiesService.incrementCirculationCount(copy._id.toString());
        await this.titlesService.incrementBorrowCount(copy.bookTitleId.toString());

        return transaction.populate([
            { path: 'copyId', select: 'barcode status condition' },
            { path: 'bookTitleId', select: 'title authors isbn coverImageUrl' },
            { path: 'borrowerId', select: 'name email' }
        ]);
    }

    /**
     * Check in a returned copy
     * - Calculates overdue days and fines
     * - Updates copy status
     * - Checks for reservations
     */
    async checkin(checkinDto: CheckinDto, librarianId: string): Promise<LibraryBorrowTransaction> {
        const tenantId = this.tenantContext.tenantId;

        // Find active transaction for this copy
        const transaction = await this.transactionModel.findOne({
            tenantId,
            copyId: checkinDto.copyId,
            status: TransactionStatus.ACTIVE,
        });

        if (!transaction) {
            throw new NotFoundException('No active transaction found for this copy');
        }

        const returnedAt = checkinDto.returnedAt || new Date();
        const daysOverdue = this.calculateDaysOverdue(transaction.dueDate, returnedAt);
        const isOverdue = daysOverdue > 0;

        // Update transaction
        transaction.returnedAt = returnedAt;
        transaction.status = TransactionStatus.RETURNED;
        transaction.daysOverdue = daysOverdue;
        transaction.isOverdue = isOverdue;
        transaction.checkinLibrarianId = librarianId;
        transaction.checkinMethod = checkinDto.checkinMethod || 'DESK';
        transaction.returnCondition = checkinDto.returnCondition || 'GOOD';
        transaction.returnNotes = checkinDto.returnNotes;

        // Assess overdue fines
        if (isOverdue && transaction.fineRatePerDay > 0) {
            const fineAmount = Math.min(
                daysOverdue * transaction.fineRatePerDay,
                transaction.maxFineAmount
            );

            if (fineAmount > 0) {
                await this.finesService.assessFine({
                    patronId: transaction.borrowerId.toString(),
                    transactionId: transaction._id.toString(),
                    copyId: transaction.copyId.toString(),
                    amount: fineAmount,
                    reason: 'OVERDUE' as any,
                    description: `Overdue fine for ${daysOverdue} days`,
                    daysOverdue,
                    fineRatePerDay: transaction.fineRatePerDay,
                });

                transaction.totalFines = fineAmount;
                transaction.hasUnpaidFines = true;
            }
        }

        await transaction.save();

        // Check for reservations
        const nextReservation = await this.reservationsService.getNextInQueue(
            transaction.bookTitleId.toString()
        );

        let newCopyStatus = CopyStatus.AVAILABLE;

        if (nextReservation) {
            // Assign copy to reservation
            await this.reservationsService.assignCopy(
                nextReservation._id.toString(),
                checkinDto.copyId
            );
            newCopyStatus = CopyStatus.ON_HOLD_SHELF;
        }

        // Update copy status
        await this.copiesService.updateStatus(checkinDto.copyId, {
            newStatus: newCopyStatus,
            reason: nextReservation 
                ? `Placed on hold for reservation` 
                : `Returned and available`,
            updatedBy: librarianId,
        });

        // Update copy condition if damaged
        if (checkinDto.returnCondition === 'DAMAGED') {
            await this.copiesService.update(checkinDto.copyId, {
                condition: 'DAMAGED' as any,
            });
        }

        return transaction.populate([
            { path: 'copyId', select: 'barcode status condition' },
            { path: 'bookTitleId', select: 'title authors isbn coverImageUrl' },
            { path: 'borrowerId', select: 'name email' }
        ]);
    }

    /**
     * Renew a transaction
     * - Validates renewal limits
     * - Checks for reservations
     * - Extends due date
     */
    async renew(renewDto: RenewDto, librarianId?: string): Promise<LibraryBorrowTransaction> {
        const tenantId = this.tenantContext.tenantId;

        const transaction = await this.transactionModel.findOne({
            _id: renewDto.transactionId,
            tenantId,
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.status !== TransactionStatus.ACTIVE) {
            throw new BadRequestException('Only active transactions can be renewed');
        }

        // Check renewal limit
        if (transaction.renewalCount >= transaction.maxRenewals) {
            throw new ForbiddenException(
                `Maximum renewal limit of ${transaction.maxRenewals} reached`
            );
        }

        // Check for reservations
        const hasReservations = await this.reservationsService.hasWaitingReservations(
            transaction.bookTitleId.toString()
        );

        const settings = await this.settingsService.getSettings();
        if (hasReservations && settings.renewalPolicy?.blockRenewalIfReserved) {
            throw new ForbiddenException(
                'Cannot renew - this item has been reserved by another patron'
            );
        }

        // Calculate new due date
        const loanPolicy = settings.defaultLoanPolicy;
        const newDueDate = new Date(
            transaction.dueDate.getTime() + loanPolicy.loanPeriodDays * 24 * 60 * 60 * 1000
        );

        // Update transaction
        transaction.renewalCount += 1;
        transaction.dueDate = newDueDate;
        transaction.expectedReturnDate = newDueDate;
        
        if (!transaction.renewalDates) transaction.renewalDates = [];
        transaction.renewalDates.push(new Date());
        
        if (renewDto.renewalNotes) {
            if (!transaction.renewalNotes) transaction.renewalNotes = [];
            transaction.renewalNotes.push(renewDto.renewalNotes);
        }

        await transaction.save();

        return transaction.populate([
            { path: 'copyId', select: 'barcode status condition' },
            { path: 'bookTitleId', select: 'title authors isbn coverImageUrl' },
            { path: 'borrowerId', select: 'name email' }
        ]);
    }

    /**
     * Get all transactions with filtering
     */
    async findAll(queryDto: TransactionQueryDto): Promise<PaginatedResponse<LibraryBorrowTransaction>> {
        const tenantId = this.tenantContext.tenantId;
        const {
            borrowerId,
            copyId,
            bookTitleId,
            status,
            isOverdue,
            fromDate,
            toDate,
            page = 1,
            limit = 50,
        } = queryDto;

        const filter: any = { tenantId };

        if (borrowerId) filter.borrowerId = borrowerId;
        if (copyId) filter.copyId = copyId;
        if (bookTitleId) filter.bookTitleId = bookTitleId;
        if (status) filter.status = status;
        if (isOverdue !== undefined) filter.isOverdue = isOverdue;
        
        if (fromDate || toDate) {
            filter.borrowedAt = {};
            if (fromDate) filter.borrowedAt.$gte = fromDate;
            if (toDate) filter.borrowedAt.$lte = toDate;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .populate('copyId', 'barcode status condition')
                .populate('bookTitleId', 'title authors isbn coverImageUrl')
                .populate('borrowerId', 'name email')
                .sort({ borrowedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.transactionModel.countDocuments(filter)
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
     * Get active transactions for a patron
     */
    async getActiveTransactionsByPatron(patronId: string): Promise<LibraryBorrowTransaction[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.transactionModel
            .find({
                tenantId,
                borrowerId: patronId,
                status: TransactionStatus.ACTIVE,
            })
            .populate('copyId', 'barcode status')
            .populate('bookTitleId', 'title authors isbn coverImageUrl')
            .sort({ dueDate: 1 });
    }

    /**
     * Get overdue transactions
     */
    async getOverdueTransactions(): Promise<LibraryBorrowTransaction[]> {
        const tenantId = this.tenantContext.tenantId;
        const now = new Date();

        return this.transactionModel
            .find({
                tenantId,
                status: TransactionStatus.ACTIVE,
                dueDate: { $lt: now },
            })
            .populate('copyId', 'barcode status')
            .populate('bookTitleId', 'title authors isbn coverImageUrl')
            .populate('borrowerId', 'name email')
            .sort({ dueDate: 1 });
    }

    /**
     * Bulk checkout
     */
    async bulkCheckout(bulkDto: BulkCheckoutDto, librarianId: string): Promise<LibraryBorrowTransaction[]> {
        const transactions: LibraryBorrowTransaction[] = [];

        for (const copyId of bulkDto.copyIds) {
            const transaction = await this.checkout({
                copyId,
                borrowerId: bulkDto.borrowerId,
                checkoutMethod: bulkDto.checkoutMethod,
            }, librarianId);
            
            transactions.push(transaction);
        }

        return transactions;
    }

    /**
     * Bulk checkin
     */
    async bulkCheckin(bulkDto: BulkCheckinDto, librarianId: string): Promise<LibraryBorrowTransaction[]> {
        const transactions: LibraryBorrowTransaction[] = [];

        for (const copyId of bulkDto.copyIds) {
            const transaction = await this.checkin({
                copyId,
                returnCondition: bulkDto.returnCondition,
                checkinMethod: bulkDto.checkinMethod,
            }, librarianId);
            
            transactions.push(transaction);
        }

        return transactions;
    }

    /**
     * Calculate days overdue
     */
    private calculateDaysOverdue(dueDate: Date, returnDate: Date): number {
        const diffMs = returnDate.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    /**
     * Mark overdue transactions (to be run as a cron job)
     */
    async markOverdueTransactions(): Promise<number> {
        const tenantId = this.tenantContext.tenantId;
        const now = new Date();

        const result = await this.transactionModel.updateMany(
            {
                tenantId,
                status: TransactionStatus.ACTIVE,
                dueDate: { $lt: now },
                isOverdue: false,
            },
            {
                $set: { isOverdue: true },
            }
        );

        return result.modifiedCount;
    }
}
