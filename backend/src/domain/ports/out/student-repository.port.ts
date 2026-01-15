import { Student } from '../../student/entities/student.entity';

export interface StudentFilters {
    search?: string; // Search by name, admission number, email
    schoolId?: string;
    class?: string;
    section?: string;
    status?: string;
    academicYear?: string;
    gender?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
}

export interface IStudentRepository {
    create(student: Student): Promise<Student>;
    findById(id: string, tenantId: string): Promise<Student | null>;
    findByIds(ids: string[], tenantId: string): Promise<Student[]>;
    findByAdmissionNumber(admissionNumber: string, tenantId: string): Promise<Student | null>;
    findAll(tenantId: string, filters?: StudentFilters): Promise<Student[]>;
    update(student: Student): Promise<Student>;
    delete(id: string, tenantId: string): Promise<void>;
    deleteMany(ids: string[], tenantId: string): Promise<number>;
    count(tenantId: string, filters?: StudentFilters): Promise<number>;
    getFilterStats(tenantId: string, filters?: StudentFilters): Promise<{
        grades: Array<{ value: string; count: number }>;
        sections: Array<{ value: string; count: number }>;
        years: Array<{ value: string; count: number }>;
        statuses: Array<{ value: string; count: number }>;
    }>;
}

export { STUDENT_REPOSITORY } from './repository.tokens';
