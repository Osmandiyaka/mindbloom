import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BookTitle represents the logical book entity (the intellectual work)
 * Separate from physical copies to support multiple copies of same title
 */
@Schema({ timestamps: true, collection: 'library_book_titles' })
export class LibraryBookTitle extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    // Core Metadata
    @Prop({ required: true, index: true })
    isbn: string;

    @Prop({ index: true })
    isbn13: string;

    @Prop({ required: true, text: true })
    title: string;

    @Prop()
    subtitle: string;

    @Prop({ required: true, type: [String] })
    authors: string[];

    @Prop({ type: [String], default: [] })
    contributors: string[]; // editors, translators, illustrators

    // Publication Info
    @Prop()
    publisher: string;

    @Prop()
    publicationYear: number;

    @Prop()
    edition: string;

    @Prop({ default: 'English' })
    language: string;

    // Physical Description
    @Prop()
    pages: number;

    @Prop()
    format: string; // hardcover, paperback, ebook, audiobook

    @Prop()
    dimensions: string; // e.g., "8.5 x 11 x 0.5 inches"

    // Classification
    @Prop({ type: [String], index: true })
    categories: string[]; // Fiction, Science, History, etc.

    @Prop({ type: [String], index: true })
    genres: string[]; // Mystery, Romance, Biography, etc.

    @Prop({ type: [String] })
    subjects: string[]; // specific topics

    @Prop({ type: [String], index: true })
    tags: string[]; // user-defined tags

    @Prop()
    deweyDecimal: string;

    @Prop()
    libraryOfCongressClass: string;

    // Content
    @Prop({ type: String })
    summary: string;

    @Prop({ type: String })
    tableOfContents: string;

    @Prop()
    coverImageUrl: string;

    // Target Audience
    @Prop()
    ageRangeMin: number;

    @Prop()
    ageRangeMax: number;

    @Prop()
    readingLevel: string; // Elementary, Middle, High School, Adult

    @Prop()
    lexileScore: string;

    // Series Info
    @Prop()
    series: string;

    @Prop()
    seriesNumber: number;

    // Awards & Recognition
    @Prop({ type: [String] })
    awards: string[];

    // Inventory Summary (denormalized for performance)
    @Prop({ default: 0 })
    totalCopies: number;

    @Prop({ default: 0 })
    availableCopies: number;

    @Prop({ default: 0 })
    totalBorrows: number; // lifetime borrows across all copies

    // Popularity Metrics
    @Prop({ default: 0 })
    reservationCount: number;

    @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    ratingCount: number;

    // Status
    @Prop({ default: true })
    isActive: boolean; // can be deactivated if outdated/inappropriate

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: false })
    isRestricted: boolean; // requires special permission

    // Metadata
    @Prop()
    catalogedBy: string; // user who added this title

    @Prop()
    catalogedAt: Date;

    @Prop()
    lastModifiedBy: string;

    @Prop({ type: Object })
    externalIds: {
        goodreadsId?: string;
        googleBooksId?: string;
        openLibraryId?: string;
        amazonAsin?: string;
    };
}

export const LibraryBookTitleSchema = SchemaFactory.createForClass(LibraryBookTitle);

// Indexes for performance
LibraryBookTitleSchema.index({ tenantId: 1, isbn: 1 }, { unique: true });
LibraryBookTitleSchema.index({ tenantId: 1, title: 'text', authors: 'text' });
LibraryBookTitleSchema.index({ tenantId: 1, categories: 1 });
LibraryBookTitleSchema.index({ tenantId: 1, availableCopies: 1 });
LibraryBookTitleSchema.index({ tenantId: 1, isFeatured: 1 });
