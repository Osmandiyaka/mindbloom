import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryBook } from './schemas/book.schema';
import { LibraryBookCopy } from './schemas/book-copy.schema';
import { LibraryTransaction, TransactionType, TransactionStatus } from './schemas/transaction.schema';
import { LibraryMember, MemberStatus } from './schemas/member.schema';
import { LibraryFine, FineType, FineStatus } from './schemas/fine.schema';
import { LibraryReservation, ReservationStatus } from './schemas/reservation.schema';

@Injectable()
export class LibraryService {
    private readonly logger = new Logger(LibraryService.name);

    // Default configuration values
    private readonly DEFAULT_LOAN_DURATION = 14;
    private readonly DEFAULT_MAX_BOOKS = 5;
    private readonly DEFAULT_FINE_PER_DAY = 1;
    private readonly DEFAULT_MAX_FINE = 50;

    constructor(
        @InjectModel('LibraryBook') private bookModel: Model<LibraryBook>,
        @InjectModel('LibraryBookCopy') private bookCopyModel: Model<LibraryBookCopy>,
        @InjectModel('LibraryTransaction') private transactionModel: Model<LibraryTransaction>,
        @InjectModel('LibraryMember') private memberModel: Model<LibraryMember>,
        @InjectModel('LibraryFine') private fineModel: Model<LibraryFine>,
        @InjectModel('LibraryReservation') private reservationModel: Model<LibraryReservation>,
    ) { }

    async createBook(tenantId: string, bookData: any): Promise<LibraryBook> {
        const book = new this.bookModel({
            ...bookData,
            tenantId,
            availableCopies: bookData.totalCopies || 0,
        });

        const savedBook = await book.save();

        if (bookData.totalCopies > 0) {
            await this.generateBookCopies(tenantId, savedBook._id.toString(), bookData.totalCopies);
        }

        this.logger.log(`Book created: ${savedBook.title}`);
        return savedBook;
    }

    async getBooks(tenantId: string, filters: any = {}): Promise<LibraryBook[]> {
        const query: any = { tenantId, isActive: true };

        if (filters.categoryId) query.categoryId = filters.categoryId;
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { author: { $regex: filters.search, $options: 'i' } },
                { isbn: { $regex: filters.search, $options: 'i' } },
            ];
        }

        return this.bookModel.find(query).sort({ title: 1 }).limit(filters.limit || 100).exec();
    }

    async getBookById(tenantId: string, bookId: string): Promise<LibraryBook> {
        const book = await this.bookModel.findOne({ _id: bookId, tenantId }).exec();
        if (!book) {
            throw new NotFoundException('Book not found');
        }
        return book;
    }

    async generateBookCopies(tenantId: string, bookId: string, count: number): Promise<void> {
        const copies = [];
        const existingCount = await this.bookCopyModel.countDocuments({ tenantId, bookId });

        for (let i = 0; i < count; i++) {
            copies.push({
                tenantId,
                bookId,
                barcode: `LIB${bookId.slice(-6)}${String(existingCount + i + 1).padStart(4, '0')}`,
                accessionNumber: `ACC${Date.now()}${i}`,
                status: 'AVAILABLE',
                condition: 'EXCELLENT',
                isActive: true,
            });
        }

        await this.bookCopyModel.insertMany(copies);
        await this.bookModel.updateOne(
            { _id: bookId, tenantId },
            { $inc: { totalCopies: count, availableCopies: count } }
        );
    }

    async scanBarcode(tenantId: string, barcode: string): Promise<any> {
        const copy = await this.bookCopyModel.findOne({ tenantId, barcode }).exec();
        if (!copy) {
            throw new NotFoundException('Barcode not found');
        }

        const book = await this.bookModel.findById(copy.bookId).exec();
        
        return {
            copy,
            book,
            action: copy.status === 'AVAILABLE' ? 'ISSUE' : 'RETURN',
        };
    }

    async getMemberLoans(tenantId: string, memberId: string): Promise<LibraryTransaction[]> {
        return this.transactionModel.find({
            tenantId,
            memberId,
            status: TransactionStatus.ACTIVE,
        }).exec();
    }

    private calculateOverdueDays(dueDate: Date, returnDate: Date): number {
        const diffTime = returnDate.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
}
