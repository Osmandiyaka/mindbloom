import { StudentNote, StudentNoteCategory } from '../../student/entities/student-note.entity';

export interface StudentNoteFilters {
  studentId: string;
  category?: StudentNoteCategory;
}

export interface IStudentNoteRepository {
  create(note: StudentNote): Promise<StudentNote>;
  findById(id: string, tenantId: string): Promise<StudentNote | null>;
  findAll(tenantId: string, filters: StudentNoteFilters): Promise<StudentNote[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const STUDENT_NOTE_REPOSITORY = 'STUDENT_NOTE_REPOSITORY';
