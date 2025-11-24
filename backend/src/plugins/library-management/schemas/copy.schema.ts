import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CopyStatus {
    AVAILABLE = 'AVAILABLE',
    CHECKED_OUT = 'CHECKED_OUT',
    RESERVED = 'RESERVED',
    IN_TRANSIT = 'IN_TRANSIT',
    ON_HOLD_SHELF = 'ON_HOLD_SHELF',
    PROCESSING = 'PROCESSING',
    LOST = 'LOST',
    DAMAGED = 'DAMAGED',
    WITHDRAWN = 'WITHDRAWN',
    MISSING = 'MISSING',
}

export enum CopyCondition {
    EXCELLENT = 'EXCELLENT',
    GOOD = 'GOOD',
    FAIR = 'FAIR',
    POOR = 'POOR',
    DAMAGED = 'DAMAGED',
}

export enum ItemType {
    BOOK = 'BOOK',
    REFERENCE = 'REFERENCE',
    PERIODICAL = 'PERIODICAL',
    AUDIOBOOK = 'AUDIOBOOK',
    DVD = 'DVD',
    EQUIPMENT = 'EQUIPMENT',
}

/**
 * BookCopy represents a physical copy of a book title
 * Each copy has its own barcode, status, location, and history
 */
@Schema({ timestamps: true, collection: 'library_book_copies' })
export class LibraryBookCopy extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookTitle', required: true, index: true })
    bookTitleId: Types.ObjectId;

    // Copy Identification
    @Prop({ required: true, unique: true, index: true })
    barcode: string;

    @Prop({ unique: true, sparse: true })
    rfidTag: string;

    @Prop({ required: true })
    accessionNumber: string; // sequential number within library

    // Status
    @Prop({
        type: String,
        enum: Object.values(CopyStatus),
        default: CopyStatus.AVAILABLE,
        index: true
    })
    status: CopyStatus;

    @Prop()
    statusChangedAt: Date;

    @Prop()
    statusChangedBy: string; // userId

    @Prop({ type: String })
    statusNote: string; // reason for status change

    // Physical Condition
    @Prop({
        type: String,
        enum: Object.values(CopyCondition),
        default: CopyCondition.GOOD
    })
    condition: CopyCondition;

    @Prop({ type: [String] })
    conditionNotes: string[];

    // Location
    @Prop({ type: Types.ObjectId, ref: 'LibraryLocation', index: true })
    locationId: Types.ObjectId;

    @Prop()
    shelfLocation: string; // human-readable: "A-3-5" (Aisle-Shelf-Bin)

    // Item Type & Circulation Rules
    @Prop({
        type: String,
        enum: Object.values(ItemType),
        default: ItemType.BOOK
    })
    itemType: ItemType;

    @Prop({ default: false })
    isReference: boolean; // reference books cannot be borrowed

    @Prop({ default: false })
    isRestricted: boolean; // requires special permission

    @Prop({ default: 21 })
    loanPeriodDays: number; // override default loan period

    @Prop({ default: true })
    isRenewable: boolean;

    @Prop({ default: 2 })
    maxRenewals: number;

    // Acquisition Info
    @Prop({ required: true })
    acquisitionDate: Date;

    @Prop()
    acquisitionMethod: string; // purchase, donation, gift

    @Prop()
    vendor: string;

    @Prop()
    purchasePrice: number;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop()
    invoiceNumber: string;

    @Prop()
    donorName: string;

    // Current Transaction
    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction' })
    currentTransactionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    currentBorrowerId: Types.ObjectId;

    @Prop()
    dueDate: Date;

    // Reservation
    @Prop({ type: Types.ObjectId, ref: 'LibraryReservation' })
    currentReservationId: Types.ObjectId;

    // Usage Statistics
    @Prop({ default: 0 })
    totalBorrows: number;

    @Prop({ default: 0 })
    totalRenewals: number;

    @Prop()
    lastBorrowedAt: Date;

    @Prop()
    lastReturnedAt: Date;

    // Maintenance
    @Prop()
    lastInventoryDate: Date;

    @Prop()
    lastInventoryBy: string;

    @Prop()
    nextMaintenanceDate: Date;

    @Prop({ default: false })
    needsRepair: boolean;

    @Prop({ type: [String] })
    repairHistory: string[];

    // Lifecycle
    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    withdrawnDate: Date;

    @Prop()
    withdrawnReason: string;

    @Prop()
    replacementCopyId: Types.ObjectId;

    // Audit
    @Prop()
    createdBy: string;

    @Prop()
    lastModifiedBy: string;
}

export const LibraryBookCopySchema = SchemaFactory.createForClass(LibraryBookCopy);

// Indexes
LibraryBookCopySchema.index({ tenantId: 1, bookTitleId: 1 });
LibraryBookCopySchema.index({ tenantId: 1, status: 1 });
LibraryBookCopySchema.index({ tenantId: 1, locationId: 1 });
LibraryBookCopySchema.index({ tenantId: 1, barcode: 1 }, { unique: true });
LibraryBookCopySchema.index({ tenantId: 1, currentBorrowerId: 1 });
LibraryBookCopySchema.index({ tenantId: 1, dueDate: 1 });
