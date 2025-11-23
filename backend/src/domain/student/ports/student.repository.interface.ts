import { Student } from '../entities/student.entity';

export interface IStudentRepository {
    findAll(): Promise<Student[]>;
    findById(id: string): Promise<Student | null>;
    findByEmail(email: string): Promise<Student | null>;
    create(student: Student): Promise<Student>;
    update(id: string, student: Partial<Student>): Promise<Student>;
    delete(id: string): Promise<void>;
}

export const STUDENT_REPOSITORY = Symbol('IStudentRepository');
