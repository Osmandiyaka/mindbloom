import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface Book {
    _id: string;
    tenantId: string;
    title: string;
    isbn: string;
    isbn13?: string;
    author: string;
    coAuthors?: string[];
    publisher?: string;
    publicationYear?: number;
    edition?: string;
    language?: string;
    pages?: number;
    categoryId: string;
    subjects?: string[];
    description?: string;
    coverImages?: string[];
    thumbnailUrl?: string;
    totalCopies: number;
    availableCopies: number;
    shelfLocation?: string;
    callNumber?: string;
    price?: number;
    supplier?: string;
    purchaseDate?: Date;
    tags?: string[];
    totalIssued: number;
    rating: number;
    ratingCount: number;
    isActive: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BookCopy {
    _id: string;
    tenantId: string;
    bookId: string;
    barcode: string;
    accessionNumber: string;
    status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'MAINTENANCE' | 'LOST' | 'DAMAGED';
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    shelfLocation?: string;
    currentBorrowerId?: string;
    currentTransactionId?: string;
    lastIssuedDate?: Date;
    dueDate?: Date;
    totalIssues: number;
    isActive: boolean;
}

export interface Transaction {
    _id: string;
    tenantId: string;
    bookId: string;
    copyId: string;
    barcode: string;
    memberId: string;
    memberType: string;
    type: 'ISSUE' | 'RETURN' | 'RENEW' | 'LOST' | 'DAMAGED';
    status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'LOST' | 'DAMAGED';
    issueDate: Date;
    dueDate: Date;
    returnDate?: Date;
    renewalCount: number;
    overdueDays: number;
    fineAmount: number;
    finePaid: boolean;
}

export interface Member {
    _id: string;
    tenantId: string;
    userId: string;
    memberType: 'STUDENT' | 'TEACHER' | 'STAFF';
    membershipNumber: string;
    name: string;
    email?: string;
    phone?: string;
    classSection?: string;
    department?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'INACTIVE';
    activeLoans: number;
    totalBorrowed: number;
    outstandingFines: number;
    maxBooksAllowed: number;
    isBlocked: boolean;
    photoUrl?: string;
}

export interface ScanResult {
    copy: BookCopy | null;
    book: Book | null;
    transaction?: Transaction;
    member?: Member;
    action: 'ISSUE' | 'RETURN';
    error?: string;
}

@Injectable({
    providedIn: 'root',
})
export class LibraryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/plugins/library`;

    // Books
    getBooks(filters?: any): Observable<Book[]> {
        return this.http.get<Book[]>(`${this.apiUrl}/books`, { params: filters });
    }

    getBook(id: string): Observable<Book> {
        return this.http.get<Book>(`${this.apiUrl}/books/${id}`);
    }

    createBook(bookData: Partial<Book>): Observable<Book> {
        return this.http.post<Book>(`${this.apiUrl}/books`, bookData);
    }

    addCopies(bookId: string, count: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/books/${bookId}/copies`, { count });
    }

    // Circulation
    scanBarcode(barcode: string): Observable<ScanResult> {
        return this.http.get<ScanResult>(`${this.apiUrl}/circulation/scan/${barcode}`);
    }

    // Members
    getMemberLoans(memberId: string): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/members/${memberId}/loans`);
    }
}
