import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'library_book_copies' })
export class LibraryBookCopy extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    bookId: string;

    @Prop({ required: true, unique: true })
    barcode: string;

    @Prop({ required: true })
    accessionNumber: string;

    @Prop({ required: true, enum: ['AVAILABLE', 'ISSUED', 'RESERVED', 'MAINTENANCE', 'LOST', 'DAMAGED'] })
    status: string;

    @Prop({ required: true, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] })
    condition: string;

    @Prop()
    shelfLocation: string;

    @Prop()
    purchaseDate: Date;

    @Prop()
    price: number;

    @Prop()
    supplier: string;

    @Prop()
    donorName: string;

    @Prop()
    currentBorrowerId: string;

    @Prop()
    currentTransactionId: string;

    @Prop()
    lastIssuedDate: Date;

    @Prop()
    dueDate: Date;

    @Prop({ default: 0 })
    totalIssues: number;

    @Prop({ type: [Object], default: [] })
    maintenanceHistory: Array<{
        date: Date;
        issue: string;
        action: string;
        cost: number;
        performedBy: string;
    }>;

    @Prop()
    notes: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const LibraryBookCopySchema = SchemaFactory.createForClass(LibraryBookCopy);

// Indexes
LibraryBookCopySchema.index({ tenantId: 1, barcode: 1 }, { unique: true });
LibraryBookCopySchema.index({ tenantId: 1, bookId: 1 });
LibraryBookCopySchema.index({ tenantId: 1, status: 1 });
LibraryBookCopySchema.index({ tenantId: 1, accessionNumber: 1 });
