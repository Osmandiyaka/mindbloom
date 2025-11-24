import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum FineStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    WAIVED = 'WAIVED',
    PARTIAL = 'PARTIAL',
}

export enum FineType {
    OVERDUE = 'OVERDUE',
    LOST_BOOK = 'LOST_BOOK',
    DAMAGED_BOOK = 'DAMAGED_BOOK',
    LATE_RETURN = 'LATE_RETURN',
}

@Schema({ timestamps: true, collection: 'library_fines' })
export class LibraryFine extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    memberId: string;

    @Prop({ required: true })
    transactionId: string;

    @Prop({ required: true })
    bookId: string;

    @Prop({ required: true })
    copyId: string;

    @Prop({ required: true, enum: Object.values(FineType) })
    fineType: FineType;

    @Prop({ required: true })
    amount: number;

    @Prop({ default: 0 })
    paidAmount: number;

    @Prop({ default: 0 })
    waivedAmount: number;

    @Prop({ required: true, enum: Object.values(FineStatus) })
    status: FineStatus;

    @Prop({ required: true })
    fineDate: Date;

    @Prop()
    dueDate: Date;

    @Prop()
    paidDate: Date;

    @Prop()
    paymentMethod: string;

    @Prop()
    paymentReference: string;

    @Prop()
    waivedBy: string;

    @Prop()
    waivedDate: Date;

    @Prop()
    waiverReason: string;

    @Prop()
    overdueDays: number;

    @Prop()
    description: string;

    @Prop()
    notes: string;
}

export const LibraryFineSchema = SchemaFactory.createForClass(LibraryFine);

// Indexes
LibraryFineSchema.index({ tenantId: 1, memberId: 1 });
LibraryFineSchema.index({ tenantId: 1, status: 1 });
LibraryFineSchema.index({ tenantId: 1, transactionId: 1 });
LibraryFineSchema.index({ tenantId: 1, fineDate: 1 });
