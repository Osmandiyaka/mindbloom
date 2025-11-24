import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BookStatus {
    AVAILABLE = 'AVAILABLE',
    ISSUED = 'ISSUED',
    RESERVED = 'RESERVED',
    MAINTENANCE = 'MAINTENANCE',
    LOST = 'LOST',
    DAMAGED = 'DAMAGED',
}

export enum BookCondition {
    EXCELLENT = 'EXCELLENT',
    GOOD = 'GOOD',
    FAIR = 'FAIR',
    POOR = 'POOR',
}

@Schema({ timestamps: true, collection: 'library_books' })
export class LibraryBook extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    isbn: string;

    @Prop()
    isbn13: string;

    @Prop({ required: true })
    author: string;

    @Prop({ type: [String], default: [] })
    coAuthors: string[];

    @Prop()
    publisher: string;

    @Prop()
    publicationYear: number;

    @Prop()
    edition: string;

    @Prop()
    language: string;

    @Prop()
    pages: number;

    @Prop({ required: true })
    categoryId: string;

    @Prop({ type: [String], default: [] })
    subjects: string[];

    @Prop()
    description: string;

    @Prop({ type: [String], default: [] })
    coverImages: string[];

    @Prop()
    thumbnailUrl: string;

    @Prop({ required: true, default: 0 })
    totalCopies: number;

    @Prop({ required: true, default: 0 })
    availableCopies: number;

    @Prop()
    shelfLocation: string;

    @Prop()
    callNumber: string;

    @Prop({ default: 0 })
    price: number;

    @Prop()
    supplier: string;

    @Prop()
    purchaseDate: Date;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: 0 })
    totalIssued: number;

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    ratingCount: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    notes: string;
}

export const LibraryBookSchema = SchemaFactory.createForClass(LibraryBook);

// Indexes
LibraryBookSchema.index({ tenantId: 1, isbn: 1 });
LibraryBookSchema.index({ tenantId: 1, title: 'text', author: 'text' });
LibraryBookSchema.index({ tenantId: 1, categoryId: 1 });
LibraryBookSchema.index({ tenantId: 1, isActive: 1 });
