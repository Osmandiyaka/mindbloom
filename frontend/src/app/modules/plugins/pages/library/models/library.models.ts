export interface BookTitle {
    _id: string;
    tenantId: string;
    isbn: string;
    isbn10?: string;
    title: string;
    subtitle?: string;
    authors: string[];
    publisher?: string;
    publishedYear?: number;
    edition?: string;
    language?: string;
    pages?: number;
    description?: string;
    categories: string[];
    genres: string[];
    tags: string[];
    deweyDecimal?: string;
    locCallNumber?: string;
    coverImageUrl?: string;
    totalCopies: number;
    availableCopies: number;
    popularity: {
        borrowCount: number;
        reservationCount: number;
        lastBorrowedAt?: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

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
    MISSING = 'MISSING'
}

export enum CopyCondition {
    EXCELLENT = 'EXCELLENT',
    GOOD = 'GOOD',
    FAIR = 'FAIR',
    POOR = 'POOR',
    DAMAGED = 'DAMAGED'
}

export interface BookCopy {
    _id: string;
    tenantId: string;
    bookTitleId: string | BookTitle;
    barcode: string;
    status: CopyStatus;
    condition: CopyCondition;
    locationId?: string;
    acquisitionDate?: Date;
    acquisitionCost?: number;
    vendor?: string;
    usageStatistics: {
        circulationCount: number;
        lastBorrowedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

export enum TransactionStatus {
    ACTIVE = 'ACTIVE',
    RETURNED = 'RETURNED',
    OVERDUE = 'OVERDUE',
    RENEWED = 'RENEWED',
    LOST = 'LOST',
    DAMAGED = 'DAMAGED',
    CLAIMED_RETURNED = 'CLAIMED_RETURNED'
}

export interface BorrowTransaction {
    _id: string;
    tenantId: string;
    copyId: string | BookCopy;
    bookTitleId: string | BookTitle;
    borrowerId: string;
    borrowedAt: Date;
    dueDate: Date;
    returnedAt?: Date;
    status: TransactionStatus;
    renewalCount: number;
    maxRenewals: number;
    daysOverdue: number;
    isOverdue: boolean;
    totalFines: number;
    hasUnpaidFines: boolean;
}

export enum ReservationStatus {
    WAITING = 'WAITING',
    NOTIFIED = 'NOTIFIED',
    ON_HOLD_SHELF = 'ON_HOLD_SHELF',
    FULFILLED = 'FULFILLED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

export interface Reservation {
    _id: string;
    tenantId: string;
    bookTitleId: string | BookTitle;
    patronId: string;
    queuePosition: number;
    status: ReservationStatus;
    reservedAt: Date;
    notifiedAt?: Date;
    expiresAt?: Date;
    pickupDeadline?: Date;
}

export interface Fine {
    _id: string;
    patronId: string;
    amount: number;
    balanceAfter: number;
    entryType: 'ASSESSED' | 'PAID' | 'WAIVED' | 'ADJUSTED';
    reason: string;
    description: string;
    recordedAt: Date;
}

export interface LibrarySettings {
    defaultLoanPolicy: {
        loanPeriodDays: number;
        maxRenewals: number;
        maxItemsCheckedOut: number;
        maxReservations: number;
    };
    finePolicy: {
        overdueRatePerDay: number;
        maxFineAmount: number;
        gracePeriodDays: number;
    };
    featureFlags: {
        enableReservations: boolean;
        enableFines: boolean;
        enableBarcodeScanner: boolean;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DashboardStats {
    totalTitles: number;
    totalCopies: number;
    availableCopies: number;
    checkedOutCopies: number;
    overdueItems: number;
    activeReservations: number;
    totalFinesCollected: number;
    patronsWithFines: number;
}
