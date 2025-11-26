export interface FeePlan {
    id: string;
    name: string;
    description?: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'term';
}

export interface Invoice {
    id: string;
    studentName: string;
    planId: string;
    dueDate: Date;
    amount: number;
    status: 'draft' | 'issued' | 'paid' | 'overdue';
    reference?: string;
}
