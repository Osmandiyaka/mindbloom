import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FineEntryType {
    ASSESSED = 'ASSESSED',     // Fine calculated and added
    PAID = 'PAID',             // Payment received
    WAIVED = 'WAIVED',         // Forgiven by staff
    ADJUSTED = 'ADJUSTED',     // Manual adjustment
    REFUNDED = 'REFUNDED',     // Payment returned
}

export enum FineReason {
    OVERDUE = 'OVERDUE',
    LOST_ITEM = 'LOST_ITEM',
    DAMAGED_ITEM = 'DAMAGED_ITEM',
    PROCESSING_FEE = 'PROCESSING_FEE',
    REPLACEMENT_COST = 'REPLACEMENT_COST',
    MANUAL = 'MANUAL',
}

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    MOBILE_MONEY = 'MOBILE_MONEY',
    BANK_TRANSFER = 'BANK_TRANSFER',
    CHEQUE = 'CHEQUE',
    WAIVER = 'WAIVER',
    OTHER = 'OTHER',
}

/**
 * Immutable append-only ledger for all fine transactions
 * Ensures complete audit trail and financial accountability
 */
@Schema({ timestamps: true, collection: 'library_fine_ledger' })
export class LibraryFineLedger extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    patronId: Types.ObjectId;

    // Entry Type
    @Prop({ 
        type: String, 
        enum: Object.values(FineEntryType), 
        required: true,
        index: true 
    })
    entryType: FineEntryType;

    // Amount (always positive, type determines debit/credit)
    @Prop({ required: true })
    amount: number;

    @Prop({ default: 'USD' })
    currency: string;

    // Running Balance (calculated at insertion)
    @Prop({ required: true })
    balanceAfter: number;

    @Prop()
    balanceBefore: number;

    // Related Entities
    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction', index: true })
    transactionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookCopy' })
    copyId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookTitle' })
    bookTitleId: Types.ObjectId;

    // Fine Details
    @Prop({ 
        type: String, 
        enum: Object.values(FineReason),
        index: true 
    })
    reason: FineReason;

    @Prop()
    description: string;

    @Prop()
    daysOverdue: number;

    @Prop()
    fineRatePerDay: number;

    // Payment Details (if entryType is PAID)
    @Prop({ 
        type: String, 
        enum: Object.values(PaymentMethod) 
    })
    paymentMethod: PaymentMethod;

    @Prop()
    paymentReference: string; // Receipt #, Transaction ID, Cheque #

    @Prop()
    paymentReceivedBy: string; // Staff ID

    @Prop()
    paymentDate: Date;

    @Prop()
    paymentNotes: string;

    // Waiver Details (if entryType is WAIVED)
    @Prop()
    waiverReason: string;

    @Prop()
    waivedBy: string; // Staff ID

    @Prop()
    waiverApprovalRequired: boolean;

    @Prop()
    waiverApprovedBy: string; // Manager/Admin ID

    @Prop()
    waiverApprovedAt: Date;

    // Refund Details (if entryType is REFUNDED)
    @Prop()
    refundReason: string;

    @Prop()
    refundedBy: string;

    @Prop()
    refundApprovedBy: string;

    @Prop({ type: Types.ObjectId, ref: 'LibraryFineLedger' })
    refundedEntryId: Types.ObjectId; // Original payment entry being refunded

    // Adjustment Details (if entryType is ADJUSTED)
    @Prop()
    adjustmentReason: string;

    @Prop()
    adjustedBy: string;

    @Prop()
    adjustmentApprovedBy: string;

    // Immutability & Audit
    @Prop({ required: true, index: true })
    recordedAt: Date; // When entry was created

    @Prop({ required: true })
    recordedBy: string; // User/System that created entry

    @Prop({ default: false })
    isVoided: boolean; // Logical deletion (never physically delete)

    @Prop()
    voidedAt: Date;

    @Prop()
    voidedBy: string;

    @Prop()
    voidReason: string;

    // Sequence for ordering
    @Prop({ required: true, index: true })
    sequenceNumber: number; // Auto-incremented per patron

    // Receipt Generation
    @Prop()
    receiptNumber: string;

    @Prop()
    receiptGeneratedAt: Date;

    @Prop({ default: false })
    receiptEmailSent: boolean;

    // Notes
    @Prop()
    notes: string;

    @Prop()
    internalNotes: string; // Staff-only notes
}

export const LibraryFineLedgerSchema = SchemaFactory.createForClass(LibraryFineLedger);

// Indexes for ledger queries
LibraryFineLedgerSchema.index({ tenantId: 1, patronId: 1, sequenceNumber: -1 });
LibraryFineLedgerSchema.index({ tenantId: 1, patronId: 1, recordedAt: -1 });
LibraryFineLedgerSchema.index({ tenantId: 1, entryType: 1, recordedAt: -1 });
LibraryFineLedgerSchema.index({ tenantId: 1, transactionId: 1 });
LibraryFineLedgerSchema.index({ tenantId: 1, receiptNumber: 1 }, { sparse: true });
LibraryFineLedgerSchema.index({ tenantId: 1, isVoided: 1 });
