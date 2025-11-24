import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionStatus {
    ACTIVE = 'ACTIVE',           // Currently borrowed
    RETURNED = 'RETURNED',        // Returned on time
    OVERDUE = 'OVERDUE',         // Not returned by due date
    RENEWED = 'RENEWED',         // Extended loan period
    LOST = 'LOST',               // Patron reported lost
    DAMAGED = 'DAMAGED',         // Returned damaged
    CLAIMED_RETURNED = 'CLAIMED_RETURNED', // Patron claims returned but not found
}

/**
 * Tracks borrowing transactions with full lifecycle
 * Immutable once completed for audit purposes
 */
@Schema({ timestamps: true, collection: 'library_borrow_transactions' })
export class LibraryBorrowTransaction extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookCopy', required: true, index: true })
    copyId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookTitle', required: true, index: true })
    bookTitleId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    borrowerId: Types.ObjectId;

    // Transaction Timeline
    @Prop({ required: true, index: true })
    borrowedAt: Date;

    @Prop({ required: true, index: true })
    dueDate: Date;

    @Prop({ index: true })
    returnedAt: Date;

    @Prop()
    expectedReturnDate: Date; // After renewals

    // Status
    @Prop({ 
        type: String, 
        enum: Object.values(TransactionStatus), 
        default: TransactionStatus.ACTIVE,
        index: true 
    })
    status: TransactionStatus;

    // Renewal Tracking
    @Prop({ default: 0 })
    renewalCount: number;

    @Prop({ default: 2 })
    maxRenewals: number;

    @Prop({ type: [Date] })
    renewalDates: Date[];

    @Prop({ type: [String] })
    renewalNotes: string[];

    // Check-out Details
    @Prop({ required: true })
    checkoutLibrarianId: string;

    @Prop()
    checkoutMethod: string; // 'DESK', 'SELF_SERVICE', 'MOBILE_APP'

    @Prop()
    checkoutLocationId: Types.ObjectId;

    // Check-in Details
    @Prop()
    checkinLibrarianId: string;

    @Prop()
    checkinMethod: string;

    @Prop()
    checkinLocationId: Types.ObjectId;

    @Prop()
    returnCondition: string; // 'GOOD', 'FAIR', 'DAMAGED'

    @Prop()
    returnNotes: string;

    // Overdue Tracking
    @Prop({ default: 0 })
    daysOverdue: number;

    @Prop({ default: false })
    isOverdue: boolean;

    @Prop({ type: [Date] })
    overdueRemindersSent: Date[];

    // Fines
    @Prop({ default: 0 })
    totalFines: number;

    @Prop({ default: 0 })
    finesPaid: number;

    @Prop({ default: 0 })
    finesWaived: number;

    @Prop({ default: false })
    hasUnpaidFines: boolean;

    // Policy Applied
    @Prop({ required: true })
    loanPeriodDays: number; // Policy at time of checkout

    @Prop()
    fineRatePerDay: number; // Policy at time of checkout

    @Prop()
    maxFineAmount: number;

    // Notes & Flags
    @Prop({ type: [String] })
    notes: string[];

    @Prop({ default: false })
    requiresFollowup: boolean;

    @Prop()
    followupReason: string;

    // Linked Transactions
    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction' })
    originalTransactionId: Types.ObjectId; // If this is a renewal

    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction' })
    renewedToTransactionId: Types.ObjectId; // If this was renewed

    @Prop({ type: Types.ObjectId, ref: 'LibraryReservation' })
    fulfilledReservationId: Types.ObjectId; // If this fulfilled a reservation
}

export const LibraryBorrowTransactionSchema = SchemaFactory.createForClass(LibraryBorrowTransaction);

// Indexes for common queries
LibraryBorrowTransactionSchema.index({ tenantId: 1, borrowerId: 1, status: 1 });
LibraryBorrowTransactionSchema.index({ tenantId: 1, copyId: 1, status: 1 });
LibraryBorrowTransactionSchema.index({ tenantId: 1, dueDate: 1, status: 1 });
LibraryBorrowTransactionSchema.index({ tenantId: 1, isOverdue: 1 });
LibraryBorrowTransactionSchema.index({ tenantId: 1, borrowedAt: 1 });
LibraryBorrowTransactionSchema.index({ tenantId: 1, returnedAt: 1 });
