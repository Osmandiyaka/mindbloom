import { Student } from '../entities/student.entity';

export interface StudentFilters {
    search?: string; // Search by name, admission number, email
    class?: string;
    section?: string;
    status?: string;
    academicYear?: string;
    gender?: string;
}

export interface IStudentRepository {
    create(student: Student): Promise<Student>;
    findById(id: string, tenantId: string): Promise<Student | null>;
    findByAdmissionNumber(admissionNumber: string, tenantId: string): Promise<Student | null>;
    findAll(tenantId: string, filters?: StudentFilters): Promise<Student[]>;
    update(student: Student): Promise<Student>;
    delete(id: string, tenantId: string): Promise<void>;
    count(tenantId: string, filters?: StudentFilters): Promise<number>;
}

export const STUDENT_REPOSITORY = Symbol('IStudentRepository');
