export interface FeePlan {
    id: string;
    name: string;
    description?: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'term';
    currency?: string;
}

export interface Invoice {
    id: string;
    studentName: string;
    studentId?: string;
    planId: string;
    planName?: string;
    dueDate: Date;
    amount: number;
    paidAmount?: number;
    balance?: number;
    currency?: string;
    status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
    reference?: string;
    notes?: string;
}

export interface Payment {
    id?: string;
    invoiceId: string;
    amount: number;
    currency?: string;
    method: 'cash' | 'card' | 'transfer' | 'online' | 'other';
    reference?: string;
    notes?: string;
    paidAt?: Date;
}
