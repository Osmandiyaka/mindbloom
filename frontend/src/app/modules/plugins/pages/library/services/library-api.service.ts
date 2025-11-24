import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    BookTitle,
    BookCopy,
    BorrowTransaction,
    Reservation,
    Fine,
    LibrarySettings,
    PaginatedResponse,
    DashboardStats
} from '../models/library.models';

@Injectable({
    providedIn: 'root'
})
export class LibraryApiService {
    private http = inject(HttpClient);
    private baseUrl = '/api/plugins/library';

    // Titles API
    getTitles(params?: {
        search?: string;
        categories?: string[];
        page?: number;
        limit?: number;
    }): Observable<PaginatedResponse<BookTitle>> {
        let httpParams = new HttpParams();
        if (params?.search) httpParams = httpParams.set('search', params.search);
        if (params?.categories) httpParams = httpParams.set('categories', params.categories.join(','));
        if (params?.page) httpParams = httpParams.set('page', params.page.toString());
        if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

        return this.http.get<PaginatedResponse<BookTitle>>(`${this.baseUrl}/titles`, { params: httpParams });
    }

    getTitle(id: string): Observable<BookTitle> {
        return this.http.get<BookTitle>(`${this.baseUrl}/titles/${id}`);
    }

    createTitle(data: Partial<BookTitle>): Observable<BookTitle> {
        return this.http.post<BookTitle>(`${this.baseUrl}/titles`, data);
    }

    updateTitle(id: string, data: Partial<BookTitle>): Observable<BookTitle> {
        return this.http.put<BookTitle>(`${this.baseUrl}/titles/${id}`, data);
    }

    deleteTitle(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/titles/${id}`);
    }

    getPopularTitles(limit = 10): Observable<BookTitle[]> {
        return this.http.get<BookTitle[]>(`${this.baseUrl}/titles/popular?limit=${limit}`);
    }

    getRecentTitles(limit = 10): Observable<BookTitle[]> {
        return this.http.get<BookTitle[]>(`${this.baseUrl}/titles/recent?limit=${limit}`);
    }

    getAllCategories(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/titles/categories`);
    }

    // Copies API
    getCopies(params?: {
        bookTitleId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Observable<PaginatedResponse<BookCopy>> {
        let httpParams = new HttpParams();
        if (params?.bookTitleId) httpParams = httpParams.set('bookTitleId', params.bookTitleId);
        if (params?.status) httpParams = httpParams.set('status', params.status);
        if (params?.page) httpParams = httpParams.set('page', params.page.toString());
        if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

        return this.http.get<PaginatedResponse<BookCopy>>(`${this.baseUrl}/copies`, { params: httpParams });
    }

    getCopyByBarcode(barcode: string): Observable<BookCopy> {
        return this.http.get<BookCopy>(`${this.baseUrl}/copies/barcode/${barcode}`);
    }

    createCopy(data: Partial<BookCopy>): Observable<BookCopy> {
        return this.http.post<BookCopy>(`${this.baseUrl}/copies`, data);
    }

    bulkCreateCopies(data: { bookTitleId: string; quantity: number }): Observable<BookCopy[]> {
        return this.http.post<BookCopy[]>(`${this.baseUrl}/copies/bulk`, data);
    }

    // Circulation API
    checkout(data: { copyId: string; borrowerId: string }): Observable<BorrowTransaction> {
        return this.http.post<BorrowTransaction>(`${this.baseUrl}/circulation/checkout`, data);
    }

    checkin(data: { copyId: string; returnCondition?: string }): Observable<BorrowTransaction> {
        return this.http.post<BorrowTransaction>(`${this.baseUrl}/circulation/checkin`, data);
    }

    renew(transactionId: string): Observable<BorrowTransaction> {
        return this.http.post<BorrowTransaction>(`${this.baseUrl}/circulation/renew`, { transactionId });
    }

    getTransactions(params?: {
        borrowerId?: string;
        status?: string;
        isOverdue?: boolean;
        page?: number;
    }): Observable<PaginatedResponse<BorrowTransaction>> {
        let httpParams = new HttpParams();
        if (params?.borrowerId) httpParams = httpParams.set('borrowerId', params.borrowerId);
        if (params?.status) httpParams = httpParams.set('status', params.status);
        if (params?.isOverdue !== undefined) httpParams = httpParams.set('isOverdue', params.isOverdue.toString());
        if (params?.page) httpParams = httpParams.set('page', params.page.toString());

        return this.http.get<PaginatedResponse<BorrowTransaction>>(`${this.baseUrl}/circulation/transactions`, { params: httpParams });
    }

    getPatronActiveTransactions(patronId: string): Observable<BorrowTransaction[]> {
        return this.http.get<BorrowTransaction[]>(`${this.baseUrl}/circulation/patron/${patronId}/active`);
    }

    getOverdueTransactions(): Observable<BorrowTransaction[]> {
        return this.http.get<BorrowTransaction[]>(`${this.baseUrl}/circulation/overdue`);
    }

    // Reservations API
    getReservations(params?: {
        patronId?: string;
        status?: string;
        page?: number;
    }): Observable<PaginatedResponse<Reservation>> {
        let httpParams = new HttpParams();
        if (params?.patronId) httpParams = httpParams.set('patronId', params.patronId);
        if (params?.status) httpParams = httpParams.set('status', params.status);
        if (params?.page) httpParams = httpParams.set('page', params.page.toString());

        return this.http.get<PaginatedResponse<Reservation>>(`${this.baseUrl}/reservations`, { params: httpParams });
    }

    createReservation(data: { bookTitleId: string; patronId: string }): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.baseUrl}/reservations`, data);
    }

    cancelReservation(id: string, reason: string): Observable<Reservation> {
        return this.http.delete<Reservation>(`${this.baseUrl}/reservations/${id}`, {
            body: { cancellationReason: reason }
        });
    }

    getReservationQueue(titleId: string): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/title/${titleId}/queue`);
    }

    // Fines API
    getPatronBalance(patronId: string): Observable<{ balance: number }> {
        return this.http.get<{ balance: number }>(`${this.baseUrl}/fines/patron/${patronId}/balance`);
    }

    getPatronLedger(patronId: string): Observable<Fine[]> {
        return this.http.get<Fine[]>(`${this.baseUrl}/fines/patron/${patronId}/history`);
    }

    recordPayment(data: { patronId: string; amount: number; paymentMethod: string }): Observable<Fine> {
        return this.http.post<Fine>(`${this.baseUrl}/fines/payment`, data);
    }

    // Settings API
    getSettings(): Observable<LibrarySettings> {
        return this.http.get<LibrarySettings>(`${this.baseUrl}/settings`);
    }

    updateSettings(data: Partial<LibrarySettings>): Observable<LibrarySettings> {
        return this.http.put<LibrarySettings>(`${this.baseUrl}/settings`, data);
    }

    // Dashboard API
    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
    }
}
