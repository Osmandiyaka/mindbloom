import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TransactionType {
    ISSUE = 'ISSUE',
    RETURN = 'RETURN',
    RENEW = 'RENEW',
    LOST = 'LOST',
    DAMAGED = 'DAMAGED',
}

export enum TransactionStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    OVERDUE = 'OVERDUE',
    LOST = 'LOST',
    DAMAGED = 'DAMAGED',
}

@Schema({ timestamps: true, collection: 'library_transactions' })
export class LibraryTransaction extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    bookId: string;

    @Prop({ required: true })
    copyId: string;

    @Prop({ required: true })
    barcode: string;

    @Prop({ required: true })
    memberId: string;

    @Prop({ required: true })
    memberType: string; // 'STUDENT', 'TEACHER', 'STAFF'

    @Prop({ required: true, enum: Object.values(TransactionType) })
    type: TransactionType;

    @Prop({ required: true, enum: Object.values(TransactionStatus) })
    status: TransactionStatus;

    @Prop({ required: true })
    issueDate: Date;

    @Prop({ required: true })
    dueDate: Date;

    @Prop()
    returnDate: Date;

    @Prop({ default: 0 })
    renewalCount: number;

    @Prop()
    issuedBy: string;

    @Prop()
    returnedTo: string;

    @Prop({ default: 0 })
    overdueDays: number;

    @Prop({ default: 0 })
    fineAmount: number;

    @Prop({ default: false })
    finePaid: boolean;

    @Prop()
    fineId: string;

    @Prop()
    returnCondition: string; // 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'

    @Prop()
    notes: string;

    @Prop()
    damageDescription: string;

    @Prop()
    lostReportDate: Date;
}

export const LibraryTransactionSchema = SchemaFactory.createForClass(LibraryTransaction);

// Indexes
LibraryTransactionSchema.index({ tenantId: 1, memberId: 1 });
LibraryTransactionSchema.index({ tenantId: 1, barcode: 1 });
LibraryTransactionSchema.index({ tenantId: 1, status: 1 });
LibraryTransactionSchema.index({ tenantId: 1, dueDate: 1 });
LibraryTransactionSchema.index({ tenantId: 1, issueDate: 1 });
LibraryTransactionSchema.index({ tenantId: 1, bookId: 1 });
