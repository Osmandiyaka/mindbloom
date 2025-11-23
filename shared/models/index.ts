export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    classId: string;
    rollNo?: string;
    status: 'Active' | 'Inactive' | 'Graduated';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Class {
    id: string;
    name: string;
    grade: string;
    section: string;
    capacity?: number;
    teacherId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone?: string;
    subjects?: string[];
    status: 'Active' | 'Inactive';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: Date;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    remarks?: string;
    createdAt?: Date;
}

export interface Fee {
    id: string;
    studentId: string;
    amount: number;
    dueDate: Date;
    paidDate?: Date;
    status: 'Pending' | 'Paid' | 'Overdue';
    type: 'Tuition' | 'Transport' | 'Library' | 'Other';
    createdAt?: Date;
    updatedAt?: Date;
}
